// Authentication and user types

export interface User {
    id: number
    email: string
    nome: string
    empresa: string
    workspaceStatus: 'PENDING' | 'ACTIVE'
    createdAt: string
    updatedAt: string
}

export interface RegisterRequest {
    email: string
    nome: string
    senha: string
    empresa: string
}

export interface LoginRequest {
    email: string
    senha: string
}

export interface AuthResponse {
    user: User
    message: string
}
