/**
 * API Client for communicating with the Exit Hatch backend server
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        })

        const data = await response.json()

        if (!response.ok) {
            return {
                success: false,
                error: data.error || `Request failed with status ${response.status}`,
            }
        }

        return {
            success: true,
            data,
        }
    } catch (error: any) {
        console.error('API request failed:', error)
        return {
            success: false,
            error: error.message || 'Network error - is the server running?',
        }
    }
}

// ============================================
// Optimism API Endpoints
// ============================================

export interface WithdrawalStatusResponse {
    success: boolean
    status: string
    statusCode: number
    ready: boolean
    readyToFinalize: boolean
}

/**
 * Get withdrawal status from the server
 */
export async function getWithdrawalStatus(
    txHash: string,
    l2ChainId: number,
    l1ChainId: number
): Promise<ApiResponse<WithdrawalStatusResponse>> {
    return apiRequest<WithdrawalStatusResponse>('/api/withdrawal/status', {
        method: 'POST',
        body: JSON.stringify({ txHash, l2ChainId, l1ChainId }),
    })
}

export interface WithdrawalProofData {
    withdrawalTransaction: {
        nonce: string
        sender: string
        target: string
        value: string
        gasLimit: string
        data: string
    }
    l2OutputIndex: number
    outputRootProof: {
        version: string
        stateRoot: string
        messagePasserStorageRoot: string
        latestBlockhash: string
    }
    withdrawalProof: string[]
}

export interface GenerateProofResponse {
    success: boolean
    proofData: WithdrawalProofData
}

/**
 * Generate withdrawal proof from the server
 */
export async function generateWithdrawalProof(
    txHash: string,
    l2ChainId: number,
    l1ChainId: number
): Promise<ApiResponse<GenerateProofResponse>> {
    return apiRequest<GenerateProofResponse>('/api/withdrawal/generate-proof', {
        method: 'POST',
        body: JSON.stringify({ txHash, l2ChainId, l1ChainId }),
    })
}

export interface FinalizationDataResponse {
    success: boolean
    ready: boolean
    statusCode: number
    message: string
}

/**
 * Get finalization data from the server
 */
export async function getFinalizationData(
    txHash: string,
    l2ChainId: number,
    l1ChainId: number
): Promise<ApiResponse<FinalizationDataResponse>> {
    return apiRequest<FinalizationDataResponse>('/api/withdrawal/finalization-data', {
        method: 'POST',
        body: JSON.stringify({ txHash, l2ChainId, l1ChainId }),
    })
}

// ============================================
// Arbitrum API Endpoints
// ============================================

export interface ArbitrumStatusResponse {
    success: boolean
    status: string
    statusCode: number
    ready: boolean
    confirmationInfo?: {
        blockNumber: number
        confirmationBlock: number
        estimatedTime: string
    }
}

/**
 * Get Arbitrum withdrawal status
 */
export async function getArbitrumWithdrawalStatus(
    txHash: string,
    l2ChainId: number,
    l1ChainId: number
): Promise<ApiResponse<ArbitrumStatusResponse>> {
    return apiRequest<ArbitrumStatusResponse>('/api/arbitrum/withdrawal/status', {
        method: 'POST',
        body: JSON.stringify({ txHash, l2ChainId, l1ChainId }),
    })
}

export interface ArbitrumProofResponse {
    success: boolean
    proof: string[]
    position: string
    caller: string
    destination: string
    arbBlockNum: string
    ethBlockNum: string
    timestamp: string
    callvalue: string
    data: string
}

/**
 * Generate Arbitrum outbox proof
 */
export async function generateArbitrumProof(
    txHash: string,
    l2ChainId: number,
    l1ChainId: number
): Promise<ApiResponse<ArbitrumProofResponse>> {
    return apiRequest<ArbitrumProofResponse>('/api/arbitrum/withdrawal/generate-proof', {
        method: 'POST',
        body: JSON.stringify({ txHash, l2ChainId, l1ChainId }),
    })
}

export interface ArbitrumChallengePeriodResponse {
    success: boolean
    challengePassed: boolean
    timeRemaining?: string
    estimatedEndTime?: number
}

/**
 * Check Arbitrum challenge period
 */
export async function checkArbitrumChallengePeriod(
    txHash: string,
    l2ChainId: number,
    l1ChainId: number
): Promise<ApiResponse<ArbitrumChallengePeriodResponse>> {
    return apiRequest<ArbitrumChallengePeriodResponse>('/api/arbitrum/withdrawal/challenge-period', {
        method: 'POST',
        body: JSON.stringify({ txHash, l2ChainId, l1ChainId }),
    })
}

// ============================================
// Health Check
// ============================================

export interface HealthCheckResponse {
    status: string
    timestamp: string
    version: string
}

/**
 * Check if the backend server is running
 */
export async function checkServerHealth(): Promise<ApiResponse<HealthCheckResponse>> {
    return apiRequest<HealthCheckResponse>('/health', {
        method: 'GET',
    })
}
