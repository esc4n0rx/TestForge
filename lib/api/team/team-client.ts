import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    WorkspaceMember,
    WorkspaceInvite,
    CreateInviteRequest,
    UpdateMemberRoleRequest,
    GetMembersResponse,
    GetInvitesResponse,
    CreateInviteResponse,
    InviteStatus
} from "../../types/team"

class TeamClient extends BaseApiClient {
    private readonly API_BASE: string

    constructor() {
        super()
        this.API_BASE = this.getApiUrl()
    }

    // ========== TEAM MEMBERS ==========

    async getMembers(workspaceId: number): Promise<ApiResponse<GetMembersResponse>> {
        return this.request<GetMembersResponse>(
            `/api/workspace/${workspaceId}/members`,
            { method: "GET" },
            this.API_BASE
        )
    }

    async updateMemberRole(
        workspaceId: number,
        userId: number,
        data: UpdateMemberRoleRequest
    ): Promise<ApiResponse<{ member: WorkspaceMember; message: string }>> {
        return this.request<{ member: WorkspaceMember; message: string }>(
            `/api/workspace/${workspaceId}/members/${userId}`,
            {
                method: "PATCH",
                body: JSON.stringify(data),
            },
            this.API_BASE
        )
    }

    async removeMember(
        workspaceId: number,
        userId: number
    ): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(
            `/api/workspace/${workspaceId}/members/${userId}`,
            { method: "DELETE" },
            this.API_BASE
        )
    }

    // ========== INVITES ==========

    async createInvite(
        workspaceId: number,
        data: CreateInviteRequest
    ): Promise<ApiResponse<CreateInviteResponse>> {
        return this.request<CreateInviteResponse>(
            `/api/workspace/${workspaceId}/invites`,
            {
                method: "POST",
                body: JSON.stringify(data),
            },
            this.API_BASE
        )
    }

    async getInvites(
        workspaceId: number,
        status?: InviteStatus
    ): Promise<ApiResponse<GetInvitesResponse>> {
        const queryParams = status ? `?status=${status}` : ""
        return this.request<GetInvitesResponse>(
            `/api/workspace/${workspaceId}/invites${queryParams}`,
            { method: "GET" },
            this.API_BASE
        )
    }

    async resendInvite(inviteId: number): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(
            `/api/invites/${inviteId}/resend`,
            { method: "POST" },
            this.API_BASE
        )
    }

    async cancelInvite(
        workspaceId: number,
        inviteId: number
    ): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(
            `/api/workspace/${workspaceId}/invites/${inviteId}`,
            { method: "DELETE" },
            this.API_BASE
        )
    }
}

export const teamClient = new TeamClient()
