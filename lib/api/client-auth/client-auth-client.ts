import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    ClientLoginRequest,
    ClientLoginResponse,
    ChangePasswordRequest,
    ClientAuthData,
    ClientFlowsResponse,
    ClientSessionsResponse,
    ClientExecutionsResponse,
} from "../../types/client-portal"

class ClientAuthClient extends BaseApiClient {
    private readonly CLIENT_AUTH_BASE: string

    constructor() {
        super()
        this.CLIENT_AUTH_BASE = `${this.getApiUrl()}/api/client-auth`
    }

    /**
     * Client login
     */
    async login(data: ClientLoginRequest): Promise<ApiResponse<ClientLoginResponse>> {
        return this.request<ClientLoginResponse>("/login", {
            method: "POST",
            body: JSON.stringify(data),
        }, this.CLIENT_AUTH_BASE)
    }

    /**
     * Client logout
     */
    async logout(): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>("/logout", {
            method: "POST",
        }, this.CLIENT_AUTH_BASE)
    }

    /**
     * Get current authenticated client
     */
    async getCurrentClient(): Promise<ApiResponse<ClientAuthData>> {
        return this.request<ClientAuthData>("/me", {
            method: "GET",
        }, this.CLIENT_AUTH_BASE)
    }

    /**
     * Change client password
     */
    async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>("/change-password", {
            method: "POST",
            body: JSON.stringify(data),
        }, this.CLIENT_AUTH_BASE)
    }

    /**
     * Get flows available to client
     */
    async getAvailableFlows(): Promise<ApiResponse<ClientFlowsResponse>> {
        return this.request<ClientFlowsResponse>("/flows", {
            method: "GET",
        }, this.CLIENT_AUTH_BASE)
    }

    /**
     * Get client's active sessions
     */
    async getSessions(): Promise<ApiResponse<ClientSessionsResponse>> {
        return this.request<ClientSessionsResponse>("/sessions", {
            method: "GET",
        }, this.CLIENT_AUTH_BASE)
    }

    /**
     * Get client's executions
     */
    async getExecutions(flowId?: number): Promise<ApiResponse<ClientExecutionsResponse>> {
        const params = flowId ? `?flowId=${flowId}` : ''
        return this.request<ClientExecutionsResponse>(`/executions${params}`, {
            method: "GET",
        }, this.CLIENT_AUTH_BASE)
    }
}

export const clientAuthClient = new ClientAuthClient()
