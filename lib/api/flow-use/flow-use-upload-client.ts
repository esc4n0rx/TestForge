import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"

interface UploadEvidenceResponse {
    attachment: {
        id: number
        secureUrl: string
        originalName: string
        fileSize: number
        mimeType: string
    }
}

/**
 * Client for uploading evidence during flow execution
 * Uses session token for authentication instead of workspace cookies
 */
class FlowUseUploadClient extends BaseApiClient {
    private readonly API_BASE: string

    constructor() {
        super()
        this.API_BASE = this.getApiUrl()
    }

    /**
     * Upload evidence file for a card execution
     * @param token Session token
     * @param cardId Card ID
     * @param file File to upload
     * @returns Upload response with secure URL
     */
    async uploadEvidence(
        token: string,
        cardId: number,
        file: File
    ): Promise<ApiResponse<UploadEvidenceResponse>> {
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch(
                `${this.API_BASE}/api/flow-use/${token}/upload/${cardId}`,
                {
                    method: "POST",
                    body: formData,
                    // No credentials needed - token in URL is sufficient
                }
            )

            const data: ApiResponse<UploadEvidenceResponse> = await response.json()

            if (!response.ok) {
                return data
            }

            return data
        } catch (error) {
            return {
                success: false,
                error: {
                    message: "Erro ao fazer upload da evidência. Verifique sua conexão.",
                    code: "NETWORK_ERROR"
                }
            }
        }
    }
}

export const flowUseUploadClient = new FlowUseUploadClient()
