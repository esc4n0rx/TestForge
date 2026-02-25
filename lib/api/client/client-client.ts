import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    Client,
    ClientGroupSummary,
    CreateClientRequest,
    UpdateClientRequest,
    CreateClientResponse,
    GetClientsResponse,
    GetClientResponse,
    UpdateClientResponse,
    ResetPasswordResponse,
    BackfillDefaultClientGroupResponse,
    GetClientGroupsResponse,
    GetClientGroupResponse,
    CreateClientGroupRequest,
    CreateClientGroupResponse,
    UpdateClientGroupRequest,
    UpdateClientGroupResponse,
    AddClientGroupMemberRequest,
    AddClientGroupMemberResponse,
    UpdateClientGroupMemberRoleRequest,
    UpdateClientGroupMemberRoleResponse,
} from "../../types/client"

class ClientClient extends BaseApiClient {
    private readonly API_BASE: string

    constructor() {
        super()
        this.API_BASE = this.getApiUrl()
    }

    async getClients(workspaceId: number): Promise<ApiResponse<GetClientsResponse>> {
        return this.request<GetClientsResponse>(
            `/api/workspace/${workspaceId}/clients`,
            { method: "GET" },
            this.API_BASE
        )
    }

    async getClient(
        workspaceId: number,
        clientId: number
    ): Promise<ApiResponse<GetClientResponse>> {
        return this.request<GetClientResponse>(
            `/api/workspace/${workspaceId}/clients/${clientId}`,
            { method: "GET" },
            this.API_BASE
        )
    }

    async createClient(
        workspaceId: number,
        data: CreateClientRequest
    ): Promise<ApiResponse<CreateClientResponse>> {
        return this.request<CreateClientResponse>(
            `/api/workspace/${workspaceId}/clients`,
            {
                method: "POST",
                body: JSON.stringify(data),
            },
            this.API_BASE
        )
    }

    async updateClient(
        workspaceId: number,
        clientId: number,
        data: UpdateClientRequest
    ): Promise<ApiResponse<UpdateClientResponse>> {
        return this.request<UpdateClientResponse>(
            `/api/workspace/${workspaceId}/clients/${clientId}`,
            {
                method: "PATCH",
                body: JSON.stringify(data),
            },
            this.API_BASE
        )
    }

    async resetClientPassword(
        workspaceId: number,
        clientId: number
    ): Promise<ApiResponse<ResetPasswordResponse>> {
        return this.request<ResetPasswordResponse>(
            `/api/workspace/${workspaceId}/clients/${clientId}/reset-password`,
            { method: "POST" },
            this.API_BASE
        )
    }

    async deleteClient(
        workspaceId: number,
        clientId: number
    ): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(
            `/api/workspace/${workspaceId}/clients/${clientId}`,
            { method: "DELETE" },
            this.API_BASE
        )
    }

    async backfillDefaultClientGroup(
        workspaceId: number
    ): Promise<ApiResponse<BackfillDefaultClientGroupResponse>> {
        return this.request<BackfillDefaultClientGroupResponse>(
            `/api/workspace/${workspaceId}/clients/groups/backfill-default`,
            { method: "POST" },
            this.API_BASE
        )
    }

    async getClientGroups(
        workspaceId: number
    ): Promise<ApiResponse<GetClientGroupsResponse>> {
        return this.request<GetClientGroupsResponse>(
            `/api/workspace/${workspaceId}/clients/groups`,
            { method: "GET" },
            this.API_BASE
        )
    }

    async getClientGroup(
        workspaceId: number,
        groupId: number
    ): Promise<ApiResponse<GetClientGroupResponse>> {
        return this.request<GetClientGroupResponse>(
            `/api/workspace/${workspaceId}/clients/groups/${groupId}`,
            { method: "GET" },
            this.API_BASE
        )
    }

    async createClientGroup(
        workspaceId: number,
        data: CreateClientGroupRequest
    ): Promise<ApiResponse<CreateClientGroupResponse>> {
        return this.request<CreateClientGroupResponse>(
            `/api/workspace/${workspaceId}/clients/groups`,
            {
                method: "POST",
                body: JSON.stringify(data),
            },
            this.API_BASE
        )
    }

    async updateClientGroup(
        workspaceId: number,
        groupId: number,
        data: UpdateClientGroupRequest
    ): Promise<ApiResponse<UpdateClientGroupResponse>> {
        return this.request<UpdateClientGroupResponse>(
            `/api/workspace/${workspaceId}/clients/groups/${groupId}`,
            {
                method: "PATCH",
                body: JSON.stringify(data),
            },
            this.API_BASE
        )
    }

    async deleteClientGroup(
        workspaceId: number,
        groupId: number
    ): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(
            `/api/workspace/${workspaceId}/clients/groups/${groupId}`,
            { method: "DELETE" },
            this.API_BASE
        )
    }

    async addClientToGroup(
        workspaceId: number,
        groupId: number,
        data: AddClientGroupMemberRequest
    ): Promise<ApiResponse<AddClientGroupMemberResponse>> {
        return this.request<AddClientGroupMemberResponse>(
            `/api/workspace/${workspaceId}/clients/groups/${groupId}/members`,
            {
                method: "POST",
                body: JSON.stringify(data),
            },
            this.API_BASE
        )
    }

    async updateClientGroupMemberRole(
        workspaceId: number,
        groupId: number,
        clientId: number,
        data: UpdateClientGroupMemberRoleRequest
    ): Promise<ApiResponse<UpdateClientGroupMemberRoleResponse>> {
        return this.request<UpdateClientGroupMemberRoleResponse>(
            `/api/workspace/${workspaceId}/clients/groups/${groupId}/members/${clientId}/role`,
            {
                method: "PATCH",
                body: JSON.stringify(data),
            },
            this.API_BASE
        )
    }

    async removeClientFromGroup(
        workspaceId: number,
        groupId: number,
        clientId: number
    ): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(
            `/api/workspace/${workspaceId}/clients/groups/${groupId}/members/${clientId}`,
            { method: "DELETE" },
            this.API_BASE
        )
    }
}

export const clientClient = new ClientClient()
