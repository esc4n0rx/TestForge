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

export interface WorkspaceMember {
    id: number
    role: 'OWNER' | 'ADMIN' | 'MEMBER'
    joinedAt: string
    user: {
        id: number
        nome: string
        email: string
    }
}

export interface WorkspaceDetails extends Workspace {
    updatedAt: string
    members: WorkspaceMember[]
}

export interface UpdateWorkspaceRequest {
    name?: string
    description?: string
}
