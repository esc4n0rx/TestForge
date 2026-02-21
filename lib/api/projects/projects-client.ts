import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    ProjectStatus,
    CreateProjectRequest,
    UpdateProjectRequest,
    ProjectsListResponse,
    ProjectResponse,
    ProjectFlowsResponse,
} from "../../types/project"

class ProjectsClient extends BaseApiClient {
    private readonly PROJECTS_BASE: string

    constructor() {
        super()
        this.PROJECTS_BASE = `${this.getApiUrl()}/api/projects`
    }

    async listProjects(status?: ProjectStatus): Promise<ApiResponse<ProjectsListResponse>> {
        const query = status ? `?status=${status}` : ""
        return this.request<ProjectsListResponse>(query, { method: "GET" }, this.PROJECTS_BASE)
    }

    async getProject(projectId: number): Promise<ApiResponse<ProjectResponse>> {
        return this.request<ProjectResponse>(`/${projectId}`, { method: "GET" }, this.PROJECTS_BASE)
    }

    async createProject(data: CreateProjectRequest): Promise<ApiResponse<ProjectResponse>> {
        return this.request<ProjectResponse>("", {
            method: "POST",
            body: JSON.stringify(data),
        }, this.PROJECTS_BASE)
    }

    async updateProject(projectId: number, data: UpdateProjectRequest): Promise<ApiResponse<ProjectResponse>> {
        return this.request<ProjectResponse>(`/${projectId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }, this.PROJECTS_BASE)
    }

    async archiveProject(projectId: number): Promise<ApiResponse<ProjectResponse>> {
        return this.request<ProjectResponse>(`/${projectId}/archive`, { method: "POST" }, this.PROJECTS_BASE)
    }

    async restoreProject(projectId: number): Promise<ApiResponse<ProjectResponse>> {
        return this.request<ProjectResponse>(`/${projectId}/restore`, { method: "POST" }, this.PROJECTS_BASE)
    }

    async listProjectFlows(projectId: number): Promise<ApiResponse<ProjectFlowsResponse>> {
        return this.request<ProjectFlowsResponse>(`/${projectId}/flows`, { method: "GET" }, this.PROJECTS_BASE)
    }

    async linkFlow(projectId: number, flowId: number): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(`/${projectId}/flows/${flowId}`, { method: "POST" }, this.PROJECTS_BASE)
    }

    async unlinkFlow(projectId: number, flowId: number): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(`/${projectId}/flows/${flowId}`, { method: "DELETE" }, this.PROJECTS_BASE)
    }
}

export const projectsClient = new ProjectsClient()
