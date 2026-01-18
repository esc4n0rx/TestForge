import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    CreateSessionRequest,
    CreateSessionResponse,
    SessionsListResponse,
    SessionStatus,
} from "../../types/client-portal"

class FlowSessionsClient extends BaseApiClient {
    private readonly API_BASE: string

    constructor() {
        super()
        this.API_BASE = this.getApiUrl()
    }

    /**
     * Create a new flow session for a client
     */
    async createSession(
        workspaceId: number,
        data: CreateSessionRequest
    ): Promise<ApiResponse<CreateSessionResponse>> {
        return this.request<CreateSessionResponse>(
            `/api/workspace/${workspaceId}/flow-sessions`,
            {
                method: "POST",
                body: JSON.stringify(data),
            },
            this.API_BASE
        )
    }

    /**
     * List all sessions in workspace
     */
    async listSessions(
        workspaceId: number,
        status?: SessionStatus
    ): Promise<ApiResponse<SessionsListResponse>> {
        const params = status ? `?status=${status}` : ''
        return this.request<SessionsListResponse>(
            `/api/workspace/${workspaceId}/flow-sessions${params}`,
            {
                method: "GET",
            },
            this.API_BASE
        )
    }

    /**
     * List sessions for a specific flow
     */
    async listFlowSessions(
        workspaceId: number,
        flowId: number,
        status?: SessionStatus
    ): Promise<ApiResponse<SessionsListResponse>> {
        const params = status ? `?status=${status}` : ''
        return this.request<SessionsListResponse>(
            `/api/workspace/${workspaceId}/flows/${flowId}/sessions${params}`,
            {
                method: "GET",
            },
            this.API_BASE
        )
    }

    /**
     * Revoke a session (client loses access immediately)
     */
    async revokeSession(
        workspaceId: number,
        sessionId: number
    ): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(
            `/api/workspace/${workspaceId}/flow-sessions/${sessionId}`,
            {
                method: "DELETE",
            },
            this.API_BASE
        )
    }
}

export const flowSessionsClient = new FlowSessionsClient()
