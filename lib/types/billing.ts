// Billing and subscription types

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'TRIALING' | 'UNPAID'
export type BillingCycle = 'MONTHLY' | 'YEARLY'
export type PlanType = 'START' | 'PRO' | 'ENTERPRISE'

export interface PlanFeature {
    code: string
    name: string
    description: string
    type: 'NUMERIC' | 'BOOLEAN'
    value: string
}

export interface Plan {
    id: number
    code: string
    name: string
    description: string
    type: PlanType
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

export interface Subscription {
    id: number
    workspaceId: number
    status: SubscriptionStatus
    plan: {
        id: number
        code: string
        name: string
        type: string
    }
    billingCycle: BillingCycle
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    stripeCustomerId: string
    stripeSubscriptionId: string
}

export interface CreateSubscriptionRequest {
    planId: number
    billingCycle: 'monthly' | 'yearly'
    successUrl: string
    cancelUrl: string
}

export interface CreateSubscriptionResponse {
    checkoutUrl: string
    sessionId: string
    message: string
}

export interface UpdatePlanRequest {
    planId: number
    billingCycle: 'monthly' | 'yearly'
}

export interface CancelSubscriptionRequest {
    immediate?: boolean
}
