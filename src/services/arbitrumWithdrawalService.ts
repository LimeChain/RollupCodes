import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers'
import ArbSysABI from '@contracts/abis/ArbSys.json'
import OutboxABI from '@contracts/abis/Outbox.json'

export interface ArbitrumWithdrawalParams {
    amount: string // Amount in ETH (e.g., "0.1")
    toAddress: string // Recipient address on L1
    arbSysAddress: string // ArbSys contract address (0x0000000000000000000000000000000000000064)
}

export interface TransactionResult {
    success: boolean
    transactionHash?: string
    error?: string
}

export interface OutboxExecutionParams {
    proof: string[] // Merkle proof
    index: number // Position in outbox
    l2Sender: string
    to: string
    l2Block: number
    l1Block: number
    l2Timestamp: number
    value: string // In wei
    data: string
    outboxAddress: string
}

/**
 * Initiate a withdrawal from Arbitrum L2 to Ethereum L1
 * This is Step 1 of the 3-step withdrawal process
 *
 * Uses ArbSys.withdrawEth() to send ETH to L1
 */
export async function initiateArbitrumWithdrawal(
    params: ArbitrumWithdrawalParams
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

        // Validate address
        if (!params.toAddress || params.toAddress.length !== 42 || !params.toAddress.startsWith('0x')) {
            return { success: false, error: 'Invalid recipient address' }
        }

        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const signerAddress = await signer.getAddress()

        // Check balance
        const balance = await provider.getBalance(signerAddress)
        const amountWei = parseEther(params.amount)

        if (balance < amountWei) {
            return {
                success: false,
                error: `Insufficient balance. You have ${formatEther(balance)} ETH but trying to withdraw ${params.amount} ETH`
            }
        }

        // Create ArbSys contract instance
        const arbSys = new Contract(
            params.arbSysAddress,
            ArbSysABI,
            signer
        )

        console.log('Initiating Arbitrum withdrawal:', {
            from: signerAddress,
            to: params.toAddress,
            amount: params.amount,
            amountWei: amountWei.toString(),
            arbSys: params.arbSysAddress,
            balance: formatEther(balance)
        })

        // Try to estimate gas first to catch errors early
        try {
            console.log('Estimating gas for Arbitrum withdrawal...')
            const gasEstimate = await arbSys.withdrawEth.estimateGas({ value: amountWei })
            console.log('Gas estimate:', gasEstimate.toString())
        } catch (estimateError: any) {
            console.error('Gas estimation failed:', estimateError)
            return {
                success: false,
                error: `Transaction would fail: ${estimateError.message || estimateError}`
            }
        }

        // Execute the withdrawal
        // For Arbitrum, we use withdrawEth() which sends ETH to the caller's address on L1
        // The destination address is implicitly the sender's address
        console.log('Calling ArbSys.withdrawEth()...')
        const tx = await arbSys.withdrawEth({ value: amountWei })

        console.log('Transaction sent:', tx.hash)
        console.log('Waiting for confirmation...')

        const receipt = await tx.wait()

        console.log('Transaction confirmed:', {
            hash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        })

        return {
            success: true,
            transactionHash: receipt.hash
        }

    } catch (error: any) {
        console.error('Arbitrum withdrawal error:', error)
        return {
            success: false,
            error: error.message || 'Failed to initiate withdrawal'
        }
    }
}

/**
 * Execute the final withdrawal on L1 Outbox
 * This is Step 3 of the 3-step withdrawal process (after 7-day challenge period)
 */
export async function executeOutboxTransaction(
    params: OutboxExecutionParams
): Promise<TransactionResult> {
    try {
        if (typeof window.ethereum === 'undefined') {
            return { success: false, error: 'MetaMask is not installed' }
        }

        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()

        // Create Outbox contract instance
        const outbox = new Contract(
            params.outboxAddress,
            OutboxABI,
            signer
        )

        console.log('Executing Outbox transaction:', {
            outbox: params.outboxAddress,
            index: params.index,
            to: params.to,
            value: params.value,
            proofLength: params.proof.length
        })

        // Check if already executed
        const isSpent = await outbox.isSpent(params.index)
        if (isSpent) {
            return {
                success: false,
                error: 'This withdrawal has already been executed'
            }
        }

        // Try to estimate gas
        try {
            console.log('Estimating gas for Outbox execution...')
            const gasEstimate = await outbox.executeTransaction.estimateGas(
                params.proof,
                params.index,
                params.l2Sender,
                params.to,
                params.l2Block,
                params.l1Block,
                params.l2Timestamp,
                params.value,
                params.data
            )
            console.log('Gas estimate:', gasEstimate.toString())
        } catch (estimateError: any) {
            console.error('Gas estimation failed:', estimateError)
            return {
                success: false,
                error: `Transaction would fail: ${estimateError.message || estimateError}`
            }
        }

        // Execute the transaction
        console.log('Calling Outbox.executeTransaction()...')
        const tx = await outbox.executeTransaction(
            params.proof,
            params.index,
            params.l2Sender,
            params.to,
            params.l2Block,
            params.l1Block,
            params.l2Timestamp,
            params.value,
            params.data
        )

        console.log('Transaction sent:', tx.hash)
        console.log('Waiting for confirmation...')

        const receipt = await tx.wait()

        console.log('Transaction confirmed:', {
            hash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        })

        return {
            success: true,
            transactionHash: receipt.hash
        }

    } catch (error: any) {
        console.error('Outbox execution error:', error)
        return {
            success: false,
            error: error.message || 'Failed to execute outbox transaction'
        }
    }
}

/**
 * Estimate gas for Arbitrum withdrawal
 */
export async function estimateArbitrumWithdrawalGas(
    params: ArbitrumWithdrawalParams
): Promise<{ success: boolean; gasEstimate?: bigint; error?: string }> {
    try {
        if (typeof window.ethereum === 'undefined') {
            return { success: false, error: 'MetaMask is not installed' }
        }

        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()

        const arbSys = new Contract(
            params.arbSysAddress,
            ArbSysABI,
            signer
        )

        const amountWei = parseEther(params.amount)
        const gasEstimate = await arbSys.withdrawEth.estimateGas({ value: amountWei })

        return {
            success: true,
            gasEstimate
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to estimate gas'
        }
    }
}
