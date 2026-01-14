// Workspace types

export interface Workspace {
    id: number
    name: string
    slug: string
    description: string | null
    isActive: boolean
    createdAt: string
    memberCount?: number
}

export interface CreateWorkspaceRequest {
    name: string
    description?: string
}
