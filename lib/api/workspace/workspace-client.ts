import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type { Workspace, CreateWorkspaceRequest, WorkspaceDetails, UpdateWorkspaceRequest } from "../../types/workspace"

class WorkspaceClient extends BaseApiClient {
    private readonly WORKSPACE_BASE: string

    constructor() {
        super()
        this.WORKSPACE_BASE = `${this.getApiUrl()}/api/workspace`
    }

    async getWorkspaces(): Promise<ApiResponse<{ workspaces: Workspace[] }>> {
        return this.request<{ workspaces: Workspace[] }>("", {
            method: "GET",
        }, this.WORKSPACE_BASE)
    }

    async getWorkspace(workspaceId: number): Promise<ApiResponse<{ workspace: WorkspaceDetails }>> {
        return this.request<{ workspace: WorkspaceDetails }>(`/${workspaceId}`, {
            method: "GET",
        }, this.WORKSPACE_BASE)
    }

    async createWorkspace(data: CreateWorkspaceRequest): Promise<ApiResponse<{ workspace: Workspace }>> {
        return this.request<{ workspace: Workspace }>("", {
            method: "POST",
            body: JSON.stringify(data),
        }, this.WORKSPACE_BASE)
    }

    async updateWorkspace(workspaceId: number, data: UpdateWorkspaceRequest): Promise<ApiResponse<{ workspace: Workspace }>> {
        return this.request<{ workspace: Workspace }>(`/${workspaceId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }, this.WORKSPACE_BASE)
    }
}

export const workspaceClient = new WorkspaceClient()
