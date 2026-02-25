import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    Flow,
    FlowWithDetails,
    FlowCard,
    FlowCardWithAttachments,
    FlowAttachment,
    FlowExecution,
    CreateFlowRequest,
    UpdateFlowRequest,
    ListFlowsFilters,
    AddCardRequest,
    UpdateCardRequest,
    StartExecutionRequest,
    UpdateExecutionRequest,
    RecordCardExecutionRequest,
    CreateFlowFromTemplateRequest,
    CloneFlowRequest,
    AIGenerateFlowRequest,
    FlowsListResponse,
    FlowResponse,
    CardResponse,
    AttachmentResponse,
    ExecutionResponse,
    AIGenerateFlowResponse,
} from "../../types/flow"

class FlowsClient extends BaseApiClient {
    private readonly FLOWS_BASE: string

    constructor() {
        super()
        this.FLOWS_BASE = `${this.getApiUrl()}/api/flows`
    }

    // ========================================================================
    // Flow Management
    // ========================================================================

    /**
     * List flows with optional filters
     */
    async listFlows(filters?: ListFlowsFilters): Promise<ApiResponse<FlowsListResponse>> {
        const params = new URLSearchParams()

        if (filters?.type) params.append('type', filters.type)
        if (filters?.environment) params.append('environment', filters.environment)
        if (filters?.status) params.append('status', filters.status)

        const queryString = params.toString()
        const endpoint = queryString ? `?${queryString}` : ''

        return this.request<FlowsListResponse>(endpoint, {
            method: "GET",
        }, this.FLOWS_BASE)
    }

    /**
     * Get flow by ID with current version and cards
     */
    async getFlow(flowId: number): Promise<ApiResponse<FlowResponse>> {
        return this.request<FlowResponse>(`/${flowId}`, {
            method: "GET",
        }, this.FLOWS_BASE)
    }

    /**
     * Create new flow
     */
    async createFlow(data: CreateFlowRequest): Promise<ApiResponse<FlowResponse>> {
        return this.request<FlowResponse>("", {
            method: "POST",
            body: JSON.stringify(data),
        }, this.FLOWS_BASE)
    }

    /**
     * Update flow metadata
     */
    async updateFlow(flowId: number, data: UpdateFlowRequest): Promise<ApiResponse<FlowResponse>> {
        return this.request<FlowResponse>(`/${flowId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }, this.FLOWS_BASE)
    }

    /**
     * Delete flow (soft delete)
     */
    async deleteFlow(flowId: number): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(`/${flowId}`, {
            method: "DELETE",
        }, this.FLOWS_BASE)
    }

    /**
     * Activate flow (set status to ACTIVE)
     */
    async activateFlow(flowId: number): Promise<ApiResponse<FlowResponse>> {
        return this.request<FlowResponse>(`/${flowId}/activate`, {
            method: "POST",
        }, this.FLOWS_BASE)
    }

    /**
     * Deactivate flow (set to DRAFT)
     */
    async deactivateFlow(flowId: number): Promise<ApiResponse<FlowResponse>> {
        return this.request<FlowResponse>(`/${flowId}/deactivate`, {
            method: "POST",
        }, this.FLOWS_BASE)
    }

    /**
     * Clone existing flow (copies current version cards/connections)
     */
    async cloneFlow(flowId: number, data: CloneFlowRequest): Promise<ApiResponse<FlowResponse>> {
        return this.request<FlowResponse>(`/${flowId}/clone`, {
            method: "POST",
            body: JSON.stringify(data),
        }, this.FLOWS_BASE)
    }

    // ========================================================================
    // Cards
    // ========================================================================

    /**
     * Add card to a flow
     */
    async addCard(flowId: number, data: AddCardRequest): Promise<ApiResponse<CardResponse>> {
        return this.request<CardResponse>(`/${flowId}/cards`, {
            method: "POST",
            body: JSON.stringify(data),
        }, this.FLOWS_BASE)
    }

    /**
     * Update card
     */
    async updateCard(cardId: number, data: UpdateCardRequest): Promise<ApiResponse<CardResponse>> {
        return this.request<CardResponse>(`/cards/${cardId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }, this.FLOWS_BASE)
    }

    /**
     * Delete card
     */
    async deleteCard(cardId: number): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(`/cards/${cardId}`, {
            method: "DELETE",
        }, this.FLOWS_BASE)
    }

    // ========================================================================
    // Attachments
    // ========================================================================

    /**
     * Upload attachment (image) to card
     */
    async uploadAttachment(cardId: number, file: File): Promise<ApiResponse<AttachmentResponse>> {
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch(`${this.FLOWS_BASE}/cards/${cardId}/attachments`, {
                method: "POST",
                body: formData,
                credentials: "include",
                // Don't set Content-Type header - browser will set it with boundary
            })

            const data: ApiResponse<AttachmentResponse> = await response.json()

            if (!response.ok) {
                return data
            }

            return data
        } catch (error) {
            return {
                success: false,
                error: {
                    message: "Erro ao fazer upload do arquivo. Verifique sua conexão.",
                    code: "UPLOAD_ERROR",
                },
            }
        }
    }

    /**
     * Delete attachment
     */
    async deleteAttachment(attachmentId: number): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(`/attachments/${attachmentId}`, {
            method: "DELETE",
        }, this.FLOWS_BASE)
    }

    // ========================================================================
    // Templates
    // ========================================================================

    /**
     * Create flow from template
     */
    async createFlowFromTemplate(
        templateId: number,
        data?: CreateFlowFromTemplateRequest
    ): Promise<ApiResponse<FlowResponse>> {
        return this.request<FlowResponse>(`/templates/${templateId}/create-flow`, {
            method: "POST",
            body: JSON.stringify(data || {}),
        }, this.FLOWS_BASE)
    }

    // ========================================================================
    // AI Flow Generation (Team/Enterprise)
    // ========================================================================

    /**
     * Generate flow using AI
     */
    async aiGenerateFlow(data: AIGenerateFlowRequest): Promise<ApiResponse<AIGenerateFlowResponse>> {
        return this.request<AIGenerateFlowResponse>("/ai-generate", {
            method: "POST",
            body: JSON.stringify(data),
        }, this.FLOWS_BASE)
    }

    // ========================================================================
    // Public Execution (no auth required)
    // ========================================================================

    /**
     * Get active flow for public execution
     */
    async getFlowForExecution(flowId: number): Promise<ApiResponse<FlowResponse>> {
        return this.request<FlowResponse>(`/public/${flowId}`, {
            method: "GET",
        }, this.FLOWS_BASE)
    }

    /**
     * Start flow execution
     */
    async startExecution(flowId: number, data?: StartExecutionRequest): Promise<ApiResponse<ExecutionResponse>> {
        return this.request<ExecutionResponse>(`/public/${flowId}/execute`, {
            method: "POST",
            body: JSON.stringify(data || {}),
        }, this.FLOWS_BASE)
    }

    /**
     * Update execution status/notes
     */
    async updateExecution(executionId: number, data: UpdateExecutionRequest): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(`/executions/${executionId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }, this.FLOWS_BASE)
    }

    /**
     * Record card execution
     */
    async recordCardExecution(
        executionId: number,
        cardId: number,
        data: RecordCardExecutionRequest
    ): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(`/executions/${executionId}/cards/${cardId}`, {
            method: "POST",
            body: JSON.stringify(data),
        }, this.FLOWS_BASE)
    }

    // ========================================================================
    // Export (Team/Enterprise)
    // ========================================================================

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
     * Get export URL for a flow
     * @param flowId Flow ID to export
     * @param format Export format (pdf or excel)
     * @param options Export options
     */
    getExportUrl(
        flowId: number,
        format: 'pdf' | 'excel' = 'pdf',
        options?: {
            includeAttachments?: boolean
            includeVersionHistory?: boolean
        }
    ): string {
        const params = new URLSearchParams()
        params.append('format', format)

        if (options?.includeAttachments !== undefined) {
            params.append('includeAttachments', String(options.includeAttachments))
        }
        if (options?.includeVersionHistory !== undefined) {
            params.append('includeVersionHistory', String(options.includeVersionHistory))
        }

        return `${this.FLOWS_BASE}/${flowId}/export?${params.toString()}`
    }

    /**
     * Get export URL for multiple flows
     */
    getMultipleExportUrl(flowIds: number[]): string {
        const params = new URLSearchParams()
        params.append('flowIds', flowIds.join(','))

        return `${this.FLOWS_BASE}/export/multiple?${params.toString()}`
    }

    /**
     * Download flow export as blob
     */
    async exportFlow(
        flowId: number,
        format: 'pdf' | 'excel',
        options?: {
            includeAttachments?: boolean
            includeVersionHistory?: boolean
        }
    ): Promise<
        | { success: true; data: { blob: Blob; filename: string } }
        | { success: false; error: { message: string; code: string } }
    > {
        const url = this.getExportUrl(flowId, format, options)

        try {
            const response = await fetch(url, {
                method: "GET",
                credentials: "include",
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                return {
                    success: false,
                    error: {
                        message: errorData?.error?.message || "Erro ao exportar flow",
                        code: errorData?.error?.code || "EXPORT_ERROR",
                    },
                }
            }

            const blob = await response.blob()
            const extension = format === "pdf" ? "pdf" : "xlsx"
            const filename = this.getFilenameFromDisposition(
                response.headers.get("content-disposition"),
                `flow-${flowId}.${extension}`
            )

            return { success: true, data: { blob, filename } }
        } catch {
            return {
                success: false,
                error: {
                    message: "Erro de conexao ao exportar flow",
                    code: "NETWORK_ERROR",
                },
            }
        }
    }

    /**
     * Download multiple flows export as blob (.xlsx)
     */
    async exportMultipleFlows(
        flowIds: number[]
    ): Promise<
        | { success: true; data: { blob: Blob; filename: string } }
        | { success: false; error: { message: string; code: string } }
    > {
        const url = this.getMultipleExportUrl(flowIds)

        try {
            const response = await fetch(url, {
                method: "GET",
                credentials: "include",
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                return {
                    success: false,
                    error: {
                        message: errorData?.error?.message || "Erro ao exportar flows",
                        code: errorData?.error?.code || "EXPORT_ERROR",
                    },
                }
            }

            const blob = await response.blob()
            const filename = this.getFilenameFromDisposition(
                response.headers.get("content-disposition"),
                `flows-export-${Date.now()}.xlsx`
            )

            return { success: true, data: { blob, filename } }
        } catch {
            return {
                success: false,
                error: {
                    message: "Erro de conexao ao exportar flows",
                    code: "NETWORK_ERROR",
                },
            }
        }
    }
}

export const flowsClient = new FlowsClient()
