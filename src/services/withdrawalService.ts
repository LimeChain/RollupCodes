import { BrowserProvider, Contract, parseEther, formatEther, isAddress, getAddress } from 'ethers'
import { getWithdrawalStatus, getFinalizationData, generateWithdrawalProof } from './apiClient'
import { getWithdrawalMessage, checkStateRootPublished } from './optimismApi'
import { L2_ETH_ADDRESS } from '../constants/addresses'
import { withdrawalLogger as log } from '../utils/logger'
import L2StandardBridgeABI from '@contracts/abis/L2StandardBridge.json'
import OptimismPortalABI from '@contracts/abis/OptimismPortal.json'

export interface WithdrawalParams {
    amount: string // Amount in ETH (e.g., "0.1")
    toAddress: string // Recipient address on L1
    l2BridgeAddress: string // L2StandardBridge contract address
}

export interface TransactionResult {
    success: boolean
    transactionHash?: string
    error?: string
}

export interface GasEstimate {
    gasLimit: bigint
    gasPrice: bigint
    totalCost: string // In ETH
}

/**
 * Initiate a withdrawal from L2 to L1
 * This is Step 1 of the withdrawal process
 */
export async function initiateWithdrawal(
    params: WithdrawalParams
): Promise<TransactionResult> {
    try {
        if (typeof window.ethereum === 'undefined') {
            return { success: false, error: 'MetaMask is not installed' }
        }

        // Validate amount
        try {
            const amountTest = parseEther(params.amount)
            if (amountTest <= BigInt(0)) {
                return { success: false, error: 'Amount must be greater than 0' }
            }
        } catch {
            return { success: false, error: 'Invalid amount format' }
        }

        // Validate address with proper checksum validation
        if (!params.toAddress || !isAddress(params.toAddress)) {
            return { success: false, error: 'Invalid recipient address' }
        }

        // Normalize address to checksummed version
        const checksummedToAddress = getAddress(params.toAddress)

        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const signerAddress = await signer.getAddress()

        // Check balance
        const balance = await provider.getBalance(signerAddress)
        const amountWeiCheck = parseEther(params.amount)
        if (balance < amountWeiCheck) {
            return {
                success: false,
                error: `Insufficient balance. You have ${formatEther(balance)} ETH but trying to withdraw ${params.amount} ETH`
            }
        }

        // Create contract instance
        const l2Bridge = new Contract(
            params.l2BridgeAddress,
            L2StandardBridgeABI,
            signer
        )

        // Parse amount to wei
        const amountWei = parseEther(params.amount)

        // Minimum gas limit for L1 execution (required by Optimism)
        const minGasLimit = 200000

        // Extra data (empty for ETH withdrawals)
        const extraData = '0x'

        log.debug('Initiating withdrawal:', {
            from: signerAddress,
            to: checksummedToAddress,
            amount: params.amount,
            amountWei: amountWei.toString(),
            l2Token: L2_ETH_ADDRESS,
            bridge: params.l2BridgeAddress,
            minGasLimit,
            balance: formatEther(balance)
        })

        // Try to estimate gas first to catch errors early
        try {
            log.debug('Estimating gas for withdrawal...')
            const gasEstimate = await l2Bridge.withdraw.estimateGas(
                L2_ETH_ADDRESS,
                amountWei,
                minGasLimit,
                extraData,
                { value: amountWei }
            )
            log.debug('Gas estimate:', gasEstimate.toString())
        } catch (estimateError: any) {
            log.error('Gas estimation failed:', estimateError)
            return {
                success: false,
                error: `Transaction would fail: ${estimateError.message || 'Gas estimation failed'}. Please check your balance includes gas fees.`
            }
        }

        // For native ETH withdrawals, use withdraw() function
        // Parameters: (l2Token, amount, minGasLimit, extraData)
        const tx = await l2Bridge.withdraw(
            L2_ETH_ADDRESS,
            amountWei,
            minGasLimit,
            extraData,
            {
                value: amountWei // Must send ETH value for native ETH withdrawal
            }
        )

        log.debug('Withdrawal transaction sent:', tx.hash)

        // Wait for transaction confirmation
        const receipt = await tx.wait()

        log.debug('Withdrawal transaction confirmed:', receipt.hash)

        return {
            success: true,
            transactionHash: receipt.hash
        }
    } catch (error: any) {
        log.error('Withdrawal initiation error:', error)

        let errorMessage = 'Failed to initiate withdrawal'

        if (error.code === 'ACTION_REJECTED') {
            errorMessage = 'Transaction rejected by user'
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
            errorMessage = 'Insufficient funds for withdrawal'
        } else if (error.message) {
            errorMessage = error.message
        }

        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Estimate gas for withdrawal transaction
 */
export async function estimateWithdrawalGas(
    params: WithdrawalParams
): Promise<GasEstimate | null> {
    try {
        if (typeof window.ethereum === 'undefined') {
            return null
        }

        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()

        const l2Bridge = new Contract(
            params.l2BridgeAddress,
            L2StandardBridgeABI,
            signer
        )

        const amountWei = parseEther(params.amount)
        const minGasLimit = 200000
        const extraData = '0x'

        // Estimate gas for withdraw() function
        const gasLimit = await l2Bridge.withdraw.estimateGas(
            L2_ETH_ADDRESS,
            amountWei,
            minGasLimit,
            extraData,
            { value: amountWei }
        )

        // Get current gas price
        const feeData = await provider.getFeeData()
        const gasPrice = feeData.gasPrice || BigInt(0)

        // Calculate total cost
        const totalCostWei = gasLimit * gasPrice
        const totalCost = formatEther(totalCostWei)

        return {
            gasLimit,
            gasPrice,
            totalCost
        }
    } catch (error) {
        log.error('Gas estimation error:', error)
        return null
    }
}

/**
 * Get withdrawal message hash for tracking
 * This hash is needed for proving and finalizing the withdrawal
 */
export async function getWithdrawalMessageHash(
    transactionHash: string
): Promise<string | null> {
    try {
        if (typeof window.ethereum === 'undefined') {
            return null
        }

        const provider = new BrowserProvider(window.ethereum)
        const receipt = await provider.getTransactionReceipt(transactionHash)

        if (!receipt) {
            return null
        }

        // Find WithdrawalInitiated event in logs
        const l2Bridge = new Contract(
            receipt.to || '',
            L2StandardBridgeABI,
            provider
        )

        const withdrawalEvents = receipt.logs
            .map(log => {
                try {
                    return l2Bridge.interface.parseLog({
                        topics: log.topics as string[],
                        data: log.data
                    })
                } catch {
                    return null
                }
            })
            .filter(event => event?.name === 'WithdrawalInitiated')

        if (withdrawalEvents.length > 0) {
            // Calculate message hash (this is simplified - real implementation needs to match Optimism's hashing)
            // In production, use @eth-optimism/sdk's hashCrossDomainMessage
            return receipt.hash
        }

        return null
    } catch (error) {
        log.error('Error getting withdrawal hash:', error)
        return null
    }
}

/**
 * Check if withdrawal is ready to be proven
 * (State root has been published to L1)
 * Uses backend API (Optimism SDK) as primary, with RPC fallback
 */
export async function isWithdrawalReadyToProve(
    transactionHash: string,
    l2ChainId: number,
    l1ChainId: number
): Promise<{ ready: boolean; status?: string; error?: string }> {
    try {
        log.debug('Checking if withdrawal is ready to prove:', transactionHash)

        // Primary: Use backend API (Optimism SDK - most accurate)
        const response = await getWithdrawalStatus(transactionHash, l2ChainId, l1ChainId)

        if (response.success && response.data) {
            return {
                ready: response.data.ready,
                status: response.data.status
            }
        }

        // Fallback: RPC-based check via L2OutputOracle on L1
        log.debug('Backend unavailable, using RPC fallback for withdrawal status')
        const messageResult = await getWithdrawalMessage(transactionHash, l2ChainId)

        if (!messageResult.success || !messageResult.message) {
            return {
                ready: false,
                error: messageResult.error || 'Withdrawal message not found'
            }
        }

        const stateRoot = await checkStateRootPublished(
            messageResult.message.blockNumber,
            l2ChainId,
            l1ChainId
        )
        return {
            ready: stateRoot.published,
            status: stateRoot.published ? 'READY_TO_PROVE' : 'STATE_ROOT_NOT_PUBLISHED'
        }
    } catch (error: any) {
        log.error('Error checking withdrawal ready to prove:', error)
        return {
            ready: false,
            error: error.message || 'Failed to check withdrawal status'
        }
    }
}

/**
 * Check if withdrawal is ready to be finalized
 * (Challenge period has passed)
 * Uses backend API (Optimism SDK) as primary
 */
export async function isWithdrawalReadyToFinalize(
    transactionHash: string,
    l2ChainId: number,
    l1ChainId: number
): Promise<{ ready: boolean; status?: string; error?: string }> {
    try {
        log.debug('Checking if withdrawal is ready to finalize:', transactionHash)

        // Use backend API to check finalization readiness
        const response = await getFinalizationData(transactionHash, l2ChainId, l1ChainId)

        if (response.success && response.data) {
            return {
                ready: response.data.ready,
                status: response.data.ready ? 'READY_FOR_RELAY' : 'IN_CHALLENGE_PERIOD'
            }
        }

        // If backend unavailable, check withdrawal status as fallback
        const statusResponse = await getWithdrawalStatus(transactionHash, l2ChainId, l1ChainId)

        if (statusResponse.success && statusResponse.data) {
            return {
                ready: statusResponse.data.readyToFinalize,
                status: statusResponse.data.status
            }
        }

        return {
            ready: false,
            error: response.error || 'Failed to check finalization status'
        }
    } catch (error: any) {
        log.error('Error checking withdrawal ready to finalize:', error)
        return {
            ready: false,
            error: error.message || 'Failed to check finalization status'
        }
    }
}

/**
 * Prove withdrawal on L1 (Step 3)
 * Fetches proof from backend, switches to L1, and submits to OptimismPortal
 */
export async function proveWithdrawal(
    transactionHash: string,
    l1PortalAddress: string,
    l2ChainId: number,
    l1ChainId: number
): Promise<TransactionResult> {
    try {
        if (typeof window.ethereum === 'undefined') {
            return { success: false, error: 'MetaMask is not installed' }
        }

        log.debug('Proving withdrawal:', transactionHash)

        // 1. Fetch proof data from backend
        const proofResponse = await generateWithdrawalProof(transactionHash, l2ChainId, l1ChainId)
        if (!proofResponse.success || !proofResponse.data?.proofData) {
            return {
                success: false,
                error: proofResponse.error || 'Failed to generate proof from server'
            }
        }

        const { proofData } = proofResponse.data

        // 2. Switch to L1 network
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${l1ChainId.toString(16)}` }],
            })
            await new Promise(resolve => setTimeout(resolve, 500))
        } catch (switchError: any) {
            return {
                success: false,
                error: `Failed to switch to L1 network: ${switchError.message}`
            }
        }

        // 3. Submit proof to OptimismPortal on L1
        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()

        const portal = new Contract(l1PortalAddress, OptimismPortalABI, signer)

        const withdrawalTx = [
            BigInt(proofData.withdrawalTransaction.nonce),
            proofData.withdrawalTransaction.sender,
            proofData.withdrawalTransaction.target,
            BigInt(proofData.withdrawalTransaction.value),
            BigInt(proofData.withdrawalTransaction.gasLimit),
            proofData.withdrawalTransaction.data,
        ]

        const outputRootProof = [
            proofData.outputRootProof.version,
            proofData.outputRootProof.stateRoot,
            proofData.outputRootProof.messagePasserStorageRoot,
            proofData.outputRootProof.latestBlockhash,
        ]

        log.debug('Submitting proof to OptimismPortal...')

        const tx = await portal.proveWithdrawalTransaction(
            withdrawalTx,
            proofData.l2OutputIndex,
            outputRootProof,
            proofData.withdrawalProof
        )

        log.debug('Prove transaction sent:', tx.hash)

        const receipt = await tx.wait()
        log.debug('Prove transaction confirmed:', receipt.hash)

        return {
            success: true,
            transactionHash: receipt.hash
        }
    } catch (error: any) {
        log.error('Prove withdrawal error:', error)

        let errorMessage = 'Failed to prove withdrawal'
        if (error.code === 'ACTION_REJECTED') {
            errorMessage = 'Transaction rejected by user'
        } else if (error.message) {
            errorMessage = error.message
        }

        return { success: false, error: errorMessage }
    }
}

/**
 * Finalize withdrawal on L1 (Step 5)
 * Switches to L1 and calls finalizeWithdrawalTransaction on OptimismPortal
 */
export async function finalizeWithdrawal(
    transactionHash: string,
    l1PortalAddress: string,
    l2ChainId: number,
    l1ChainId: number
): Promise<TransactionResult> {
    try {
        if (typeof window.ethereum === 'undefined') {
            return { success: false, error: 'MetaMask is not installed' }
        }

        log.debug('Finalizing withdrawal:', transactionHash)

        // 1. Fetch proof data to get the withdrawal transaction struct
        const proofResponse = await generateWithdrawalProof(transactionHash, l2ChainId, l1ChainId)
        if (!proofResponse.success || !proofResponse.data?.proofData) {
            return {
                success: false,
                error: proofResponse.error || 'Failed to get withdrawal data from server'
            }
        }

        const { proofData } = proofResponse.data

        // 2. Switch to L1 network
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${l1ChainId.toString(16)}` }],
            })
            await new Promise(resolve => setTimeout(resolve, 500))
        } catch (switchError: any) {
            return {
                success: false,
                error: `Failed to switch to L1 network: ${switchError.message}`
            }
        }

        // 3. Call finalizeWithdrawalTransaction on OptimismPortal
        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()

        const portal = new Contract(l1PortalAddress, OptimismPortalABI, signer)

        const withdrawalTx = [
            BigInt(proofData.withdrawalTransaction.nonce),
            proofData.withdrawalTransaction.sender,
            proofData.withdrawalTransaction.target,
            BigInt(proofData.withdrawalTransaction.value),
            BigInt(proofData.withdrawalTransaction.gasLimit),
            proofData.withdrawalTransaction.data,
        ]

        log.debug('Finalizing on OptimismPortal...')

        const tx = await portal.finalizeWithdrawalTransaction(withdrawalTx)

        log.debug('Finalize transaction sent:', tx.hash)

        const receipt = await tx.wait()
        log.debug('Finalize transaction confirmed:', receipt.hash)

        return {
            success: true,
            transactionHash: receipt.hash
        }
    } catch (error: any) {
        log.error('Finalize withdrawal error:', error)

        let errorMessage = 'Failed to finalize withdrawal'
        if (error.code === 'ACTION_REJECTED') {
            errorMessage = 'Transaction rejected by user'
        } else if (error.message) {
            errorMessage = error.message
        }

        return { success: false, error: errorMessage }
    }
}
