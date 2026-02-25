import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    ClientLoginRequest,
    ClientLoginResponse,
    ClientChangePasswordRequest,
    ClientAuthData,
    ClientFlowsResponse,
    ClientFlowsProgressResponse,
    ClientSessionsResponse,
    ClientExecutionsResponse,
    ClientPortalGroupInfoResponse,
    ClientPortalGroupMembersResponse,
    AddClientToMyGroupRequest,
    UpdateMyClientGroupMemberRoleRequest,
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
    async changePassword(data: ClientChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
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
     * Get client flow progress summary/status for UI cards
     */
    async getFlowsProgress(): Promise<ApiResponse<ClientFlowsProgressResponse>> {
        return this.request<ClientFlowsProgressResponse>("/flows/progress", {
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

    /**
     * Get current client group info and role in portal
     */
    async getMyGroup(): Promise<ApiResponse<ClientPortalGroupInfoResponse>> {
        return this.request<ClientPortalGroupInfoResponse>("/group", {
            method: "GET",
        }, this.CLIENT_AUTH_BASE)
    }

    /**
     * List members of the current client's group
     */
    async getMyGroupMembers(): Promise<ApiResponse<ClientPortalGroupMembersResponse>> {
        return this.request<ClientPortalGroupMembersResponse>("/group/members", {
            method: "GET",
        }, this.CLIENT_AUTH_BASE)
    }

    /**
     * Add an existing workspace client to current group (GROUP_ADMIN only)
     */
    async addClientToMyGroup(data: AddClientToMyGroupRequest): Promise<ApiResponse<{ message?: string }>> {
        return this.request<{ message?: string }>("/group/members", {
            method: "POST",
            body: JSON.stringify(data),
        }, this.CLIENT_AUTH_BASE)
    }

    /**
     * Update a member role in current group (GROUP_ADMIN only)
     */
    async updateMyGroupMemberRole(
        clientId: number,
        data: UpdateMyClientGroupMemberRoleRequest
    ): Promise<ApiResponse<{ message?: string }>> {
        return this.request<{ message?: string }>(`/group/members/${clientId}/role`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }, this.CLIENT_AUTH_BASE)
    }

    /**
     * Remove a member from current group (GROUP_ADMIN only)
     */
    async removeClientFromMyGroup(clientId: number): Promise<ApiResponse<{ message?: string }>> {
        return this.request<{ message?: string }>(`/group/members/${clientId}`, {
            method: "DELETE",
        }, this.CLIENT_AUTH_BASE)
    }
}

export const clientAuthClient = new ClientAuthClient()
