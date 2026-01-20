import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    ExecutionFilters,
    ClientExecutionFilters,
    ExecutionsListResponse,
    ExecutionDetailsResponse,
    FlowStatisticsResponse,
    WorkspaceStatisticsResponse,
} from "../../types/flow-analysis"

class FlowAnalysisClient extends BaseApiClient {
    private readonly API_BASE: string

    constructor() {
        super()
        this.API_BASE = this.getApiUrl()
    }

    /**
     * List all executions in workspace with filters
     */
    async listWorkspaceExecutions(
        workspaceId: number,
        filters?: ExecutionFilters
    ): Promise<ApiResponse<ExecutionsListResponse>> {
        const params = new URLSearchParams()

        if (filters?.flowId) params.append('flowId', filters.flowId.toString())
        if (filters?.clientId) params.append('clientId', filters.clientId.toString())
        if (filters?.status) params.append('status', filters.status)
        if (filters?.startDate) params.append('startDate', filters.startDate)
        if (filters?.endDate) params.append('endDate', filters.endDate)
        if (filters?.limit) params.append('limit', filters.limit.toString())
        if (filters?.offset) params.append('offset', filters.offset.toString())

        const queryString = params.toString()
        const endpoint = `/api/workspace/${workspaceId}/flow-analysis/executions${queryString ? `?${queryString}` : ''}`

        return this.request<ExecutionsListResponse>(
            endpoint,
            { method: "GET" },
            this.API_BASE
        )
    }

    /**
     * Get detailed information about a specific execution
     */
    async getExecutionDetails(
        workspaceId: number,
        executionId: number
    ): Promise<ApiResponse<ExecutionDetailsResponse>> {
        return this.request<ExecutionDetailsResponse>(
            `/api/workspace/${workspaceId}/flow-analysis/executions/${executionId}`,
            { method: "GET" },
            this.API_BASE
        )
    }

    /**
     * Get statistics for a specific flow
     */
    async getFlowStatistics(
        workspaceId: number,
        flowId: number
    ): Promise<ApiResponse<FlowStatisticsResponse>> {
        return this.request<FlowStatisticsResponse>(
            `/api/workspace/${workspaceId}/flow-analysis/flows/${flowId}/statistics`,
            { method: "GET" },
            this.API_BASE
        )
    }

    /**
     * Get general workspace statistics
     */
    async getWorkspaceStatistics(
        workspaceId: number
    ): Promise<ApiResponse<WorkspaceStatisticsResponse>> {
        return this.request<WorkspaceStatisticsResponse>(
            `/api/workspace/${workspaceId}/flow-analysis/statistics`,
            { method: "GET" },
            this.API_BASE
        )
    }

    /**
     * List executions for a specific client
     */
    async listClientExecutions(
        workspaceId: number,
        clientId: number,
        filters?: ClientExecutionFilters
    ): Promise<ApiResponse<ExecutionsListResponse>> {
        const params = new URLSearchParams()

        if (filters?.flowId) params.append('flowId', filters.flowId.toString())
        if (filters?.status) params.append('status', filters.status)
        if (filters?.limit) params.append('limit', filters.limit.toString())
        if (filters?.offset) params.append('offset', filters.offset.toString())

        const queryString = params.toString()
        const endpoint = `/api/workspace/${workspaceId}/flow-analysis/clients/${clientId}/executions${queryString ? `?${queryString}` : ''}`

        return this.request<ExecutionsListResponse>(
            endpoint,
            { method: "GET" },
            this.API_BASE
        )
    }
}

export const flowAnalysisClient = new FlowAnalysisClient()
