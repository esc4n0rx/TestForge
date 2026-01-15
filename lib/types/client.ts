// Client types

export interface Client {
    id: number
    nome: string
    email: string
    company: string | null
    type: 'CLIENT'
    workspaceStatus: 'ACTIVE'
    createdAt: string
    workspaceMemberships: Array<{
        id: number
        workspaceId: number
        joinedAt: string
        workspace: {
            id: number
            name: string
            slug: string
        }
    }>
}

export interface CreateClientRequest {
    nome: string
    email: string
    company?: string
}

export interface UpdateClientRequest {
    nome?: string
    company?: string
}

export interface CreateClientResponse {
    client: Client
    temporaryPassword: string
    message: string
}

export interface GetClientsResponse {
    clients: Client[]
    count: number
}

export interface GetClientResponse {
    client: Client
}

export interface UpdateClientResponse {
    client: Client
    message: string
}

export interface ResetPasswordResponse {
    temporaryPassword: string
    message: string
}
