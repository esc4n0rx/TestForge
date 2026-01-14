import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    Plan,
    Subscription,
    CreateSubscriptionRequest,
    CreateSubscriptionResponse,
    UpdatePlanRequest,
    CancelSubscriptionRequest
} from "../../types/billing"

class BillingClient extends BaseApiClient {
    private readonly BILLING_BASE: string

    constructor() {
        super()
        this.BILLING_BASE = `${this.getApiUrl()}/api/billing`
    }

    async getPlans(): Promise<ApiResponse<{ plans: Plan[] }>> {
        return this.request<{ plans: Plan[] }>("/plans", {
            method: "GET",
        }, this.BILLING_BASE)
    }

    async getPlan(id: number): Promise<ApiResponse<{ plan: Plan }>> {
        return this.request<{ plan: Plan }>(`/plans/${id}`, {
            method: "GET",
        }, this.BILLING_BASE)
    }

    async getSubscription(): Promise<ApiResponse<{ subscription: Subscription }>> {
        return this.request<{ subscription: Subscription }>("/subscription", {
            method: "GET",
        }, this.BILLING_BASE)
    }

    async createSubscription(data: CreateSubscriptionRequest): Promise<ApiResponse<CreateSubscriptionResponse>> {
        return this.request<CreateSubscriptionResponse>("/subscription", {
            method: "POST",
            body: JSON.stringify(data),
        }, this.BILLING_BASE)
    }

    async updatePlan(data: UpdatePlanRequest): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>("/subscription/plan", {
            method: "PUT",
            body: JSON.stringify(data),
        }, this.BILLING_BASE)
    }

    async cancelSubscription(data?: CancelSubscriptionRequest): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>("/subscription/cancel", {
            method: "POST",
            body: JSON.stringify(data || {}),
        }, this.BILLING_BASE)
    }

    async reactivateSubscription(): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>("/subscription/reactivate", {
            method: "POST",
        }, this.BILLING_BASE)
    }
}

export const billingClient = new BillingClient()
