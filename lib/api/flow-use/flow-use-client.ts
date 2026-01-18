import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    FlowUseSessionResponse,
    StartExecutionResponse,
    CompleteExecutionRequest,
    FlowExecutionWithDetails,
    CardExecutionRecord,
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
}

export const flowUseClient = new FlowUseClient()
