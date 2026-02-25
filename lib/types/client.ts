// Client types

export interface Client {
    id: number
    nome: string
    email: string
    company: string | null
    type: 'CLIENT'
    workspaceStatus: 'ACTIVE'
    createdAt: string
    updatedAt?: string
    clientGroupId?: number | null
    clientPortalRole?: ClientPortalRole | null
    clientGroup?: {
        id: number
        name: string
        isDefault?: boolean
    } | null
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

export type ClientPortalRole = "VIEWER" | "TESTER" | "GROUP_ADMIN"

export interface ClientGroupSummary {
    id: number
    workspaceId: number
    name: string
    isDefault: boolean
    createdAt?: string
    updatedAt?: string
    _count?: {
        members: number
    }
}

export interface ClientGroupMember extends Client {
    clientPortalRole: ClientPortalRole | null
}

export interface ClientGroupDetail extends ClientGroupSummary {
    members: ClientGroupMember[]
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

export interface BackfillDefaultClientGroupResponse {
    group: ClientGroupSummary
    updatedClients: number
}

export interface GetClientGroupsResponse {
    groups: ClientGroupSummary[]
    count?: number
}

export interface GetClientGroupResponse {
    group: ClientGroupDetail
}

export interface CreateClientGroupRequest {
    name: string
}

export interface CreateClientGroupResponse {
    group: ClientGroupSummary
    message?: string
}

export interface UpdateClientGroupRequest {
    name: string
}

export interface UpdateClientGroupResponse {
    group: ClientGroupSummary
    message?: string
}

export interface AddClientGroupMemberRequest {
    clientId: number
    role?: ClientPortalRole
}

export interface AddClientGroupMemberResponse {
    group: ClientGroupDetail
    member?: ClientGroupMember
    message?: string
}

export interface UpdateClientGroupMemberRoleRequest {
    role: ClientPortalRole
}

export interface UpdateClientGroupMemberRoleResponse {
    clientId?: number
    role: ClientPortalRole
    group?: ClientGroupSummary
    message?: string
}
