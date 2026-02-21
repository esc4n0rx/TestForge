import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    FlowUseSessionResponse,
    StartExecutionResponse,
    CompleteExecutionRequest,
    FlowExecutionWithDetails,
    CardExecutionRecord,
    SignExecutionRequest,
    SignExecutionResponse,
} from "../../types/client-portal"
import type {
    StartExecutionRequest,
    RecordCardExecutionRequest,
} from "../../types/flow"

class FlowUseClient extends BaseApiClient {
    private readonly FLOW_USE_BASE: string

    constructor() {
        super()
        this.FLOW_USE_BASE = `${this.getApiUrl()}/api/flow-use`
    }

    private getFilenameFromDisposition(contentDisposition: string | null, fallback: string): string {
        if (!contentDisposition) return fallback

        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
        if (utf8Match?.[1]) {
            try {
                return decodeURIComponent(utf8Match[1])
            } catch {
                return utf8Match[1]
            }
        }

        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
        if (filenameMatch?.[1]) {
            return filenameMatch[1]
        }

        return fallback
    }

    /**
     * Get flow by session token (public access)
     */
    async getFlowByToken(token: string): Promise<ApiResponse<FlowUseSessionResponse>> {
        return this.request<FlowUseSessionResponse>(`/${token}`, {
            method: "GET",
        }, this.FLOW_USE_BASE)
    }

    /**
     * Start flow execution
     */
    async startExecution(token: string, data?: StartExecutionRequest): Promise<ApiResponse<StartExecutionResponse>> {
        return this.request<StartExecutionResponse>(`/${token}/start`, {
            method: "POST",
            body: JSON.stringify(data || {}),
        }, this.FLOW_USE_BASE)
    }

    /**
     * Record card execution
     */
    async recordCardExecution(
        executionId: number,
        cardId: number,
        data: RecordCardExecutionRequest
    ): Promise<ApiResponse<{ cardExecution: CardExecutionRecord }>> {
        return this.request<{ cardExecution: CardExecutionRecord }>(
            `/executions/${executionId}/cards/${cardId}`,
            {
                method: "POST",
                body: JSON.stringify(data),
            },
            this.FLOW_USE_BASE
        )
    }

    /**
     * Complete execution
     */
    async completeExecution(
        executionId: number,
        data?: CompleteExecutionRequest
    ): Promise<ApiResponse<{ execution: { id: number; status: string; completedAt: string }; message: string }>> {
        return this.request(
            `/executions/${executionId}/complete`,
            {
                method: "POST",
                body: JSON.stringify(data || {}),
            },
            this.FLOW_USE_BASE
        )
    }

    /**
     * Get execution details
     */
    async getExecution(executionId: number): Promise<ApiResponse<{ execution: FlowExecutionWithDetails }>> {
        return this.request<{ execution: FlowExecutionWithDetails }>(
            `/executions/${executionId}`,
            {
                method: "GET",
            },
            this.FLOW_USE_BASE
        )
    }

    /**
     * Sign execution after completion
     */
    async signExecution(
        executionId: number,
        data: SignExecutionRequest
    ): Promise<ApiResponse<SignExecutionResponse>> {
        return this.request<SignExecutionResponse>(
            `/executions/${executionId}/sign`,
            {
                method: "POST",
                body: JSON.stringify(data),
            },
            this.FLOW_USE_BASE
        )
    }

    /**
     * Export signed execution as PDF
     */
    async exportExecutionPdf(
        executionId: number
    ): Promise<
        | { success: true; data: { blob: Blob; filename: string } }
        | { success: false; error: { message: string; code: string } }
    > {
        try {
            const response = await fetch(`${this.FLOW_USE_BASE}/executions/${executionId}/export-pdf`, {
                method: "GET",
                credentials: "include",
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                return {
                    success: false,
                    error: {
                        message: errorData?.error?.message || "Erro ao exportar PDF da execucao",
                        code: errorData?.error?.code || "EXPORT_ERROR",
                    },
                }
            }

            const blob = await response.blob()
            const filename = this.getFilenameFromDisposition(
                response.headers.get("content-disposition"),
                `execucao-assinada-${executionId}.pdf`
            )

            return { success: true, data: { blob, filename } }
        } catch {
            return {
                success: false,
                error: {
                    message: "Erro de conexao ao exportar PDF da execucao",
                    code: "NETWORK_ERROR",
                },
            }
        }
    }
}

export const flowUseClient = new FlowUseClient()
