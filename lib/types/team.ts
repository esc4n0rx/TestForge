// Team and invite types

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER'

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELED' | 'REJECTED'

export interface WorkspaceMember {
    id: number
    userId: number
    workspaceId: number
    role: Role
    joinedAt: string
    user: {
        id: number
        nome: string
        email: string
    }
}

export interface WorkspaceInvite {
    id: number
    email: string
    role: Role
    status: InviteStatus
    invitedBy: {
        id: number
        nome: string
    }
    invitedAt: string
    expiresAt: string
    acceptedAt: string | null
    canceledAt: string | null
}

export interface CreateInviteRequest {
    email: string
    role: 'ADMIN' | 'MEMBER' // Cannot invite as OWNER
}

export interface UpdateMemberRoleRequest {
    role: Role
}

export interface GetMembersResponse {
    members: WorkspaceMember[]
    count: number
}

export interface GetInvitesResponse {
    invites: WorkspaceInvite[]
    count: number
}

export interface CreateInviteResponse {
    invite: WorkspaceInvite
    message: string
}
