// TypeScript types for authentication API

export interface User {
    id: number
    email: string
    nome: string
    empresa: string
    workspaceStatus: 'PENDING' | 'ACTIVE'
    createdAt: string
    updatedAt: string
}

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

// Billing types
export interface Plan {
    id: number
    code: string
    name: string
    description: string
    type: 'START' | 'PRO' | 'ENTERPRISE'
    pricing: {
        monthly: {
            value: number
            formatted: string
        }
        yearly: {
            value: number
            formatted: string
            monthlyEquivalent: string
        }
    }
    features: PlanFeature[]
}

export interface PlanFeature {
    code: string
    name: string
    description: string
    type: 'NUMERIC' | 'BOOLEAN'
    value: string
}

export interface Subscription {
    id: number
    workspaceId: number
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'TRIALING' | 'UNPAID'
    plan: {
        id: number
        code: string
        name: string
        type: string
    }
    billingCycle: 'MONTHLY' | 'YEARLY'
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    stripeCustomerId: string
    stripeSubscriptionId: string
}

export interface CreateSubscriptionRequest {
    planId: number
    billingCycle: 'monthly' | 'yearly'
}

export interface CreateSubscriptionResponse {
    subscriptionId: string
    clientSecret: string
    status: string
    message: string
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

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: ApiError
}

export interface ApiError {
    message: string
    code: string
    details?: Array<{
        field: string
        message: string
    }>
}

export interface AuthResponse {
    user: User
    message: string
}
