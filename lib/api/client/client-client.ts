import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    Client,
    CreateClientRequest,
    UpdateClientRequest,
    CreateClientResponse,
    GetClientsResponse,
    GetClientResponse,
    UpdateClientResponse,
    ResetPasswordResponse
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
}

export const clientClient = new ClientClient()
