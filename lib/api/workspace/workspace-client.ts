import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type { Workspace, CreateWorkspaceRequest } from "../../types/workspace"

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

    async createWorkspace(data: CreateWorkspaceRequest): Promise<ApiResponse<{ workspace: Workspace }>> {
        return this.request<{ workspace: Workspace }>("", {
            method: "POST",
            body: JSON.stringify(data),
        }, this.WORKSPACE_BASE)
    }
}

export const workspaceClient = new WorkspaceClient()
