import type { FlowWithDetails } from "./flow"

export type ProjectStatus = "ACTIVE" | "ARCHIVED"

export interface ProjectMetrics {
    totalFlows: number
    activeFlows: number
    totalExecutions: number
    totalErrors: number
    successRate: number
    errorRate: number
    progressoGeral: number
}

export interface Project {
    id: number
    workspaceId: number
    name: string
    description: string | null
    client: string
    status: ProjectStatus
    createdBy: number
    createdAt: string
    updatedAt: string
    workspace?: {
        id: number
        name: string
        slug: string
    }
    creator?: {
        id: number
        nome: string
        email: string
    }
    _count?: {
        flows: number
    }
    metrics?: ProjectMetrics
}

export interface CreateProjectRequest {
    name: string
    client: string
    description?: string
}

export interface UpdateProjectRequest {
    name?: string
    client?: string
    description?: string
}

export interface ProjectsListResponse {
    projects: Project[]
}

export interface ProjectResponse {
    project: Project
}

export interface ProjectFlowsResponse {
    flows: FlowWithDetails[]
}
