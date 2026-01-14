import type {
    User,
    RegisterRequest,
    LoginRequest,
    ApiResponse,
    AuthResponse,
    Workspace,
    CreateWorkspaceRequest,
    Plan,
    Subscription,
    CreateSubscriptionRequest,
    CreateSubscriptionResponse
} from "./auth-types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
const AUTH_BASE = `${API_URL}/api/auth`
const WORKSPACE_BASE = `${API_URL}/api/workspace`
const BILLING_BASE = `${API_URL}/api/billing`

// Debug: Log the configured URLs (only in development)
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 API Configuration:')
    console.log('  NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    console.log('  API_URL:', API_URL)
    console.log('  AUTH_BASE:', AUTH_BASE)
    console.log('  WORKSPACE_BASE:', WORKSPACE_BASE)
    console.log('  BILLING_BASE:', BILLING_BASE)
}


class ApiClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        baseUrl: string = AUTH_BASE
    ): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                },
                credentials: "include", // Important for session cookies
            })

            const data: ApiResponse<T> = await response.json()

            // If response is not ok, throw the error from the API
            if (!response.ok) {
                return data
            }

            return data
        } catch (error) {
            // Network or parsing errors
            return {
                success: false,
                error: {
                    message: "Erro de conexão. Verifique sua internet e tente novamente.",
                    code: "NETWORK_ERROR",
                },
            }
        }
    }

    async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
        return this.request<AuthResponse>("/register", {
            method: "POST",
            body: JSON.stringify(data),
        })
    }

    async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
        return this.request<AuthResponse>("/login", {
            method: "POST",
            body: JSON.stringify(data),
        })
    }

    async logout(): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>("/logout", {
            method: "POST",
        })
    }

    async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
        return this.request<{ user: User }>("/me", {
            method: "GET",
        })
    }

    async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>("/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
        })
    }

    async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>("/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, newPassword }),
        })
    }

    // Workspace endpoints
    async getWorkspaces(): Promise<ApiResponse<{ workspaces: Workspace[] }>> {
        return this.request<{ workspaces: Workspace[] }>("", {
            method: "GET",
        }, WORKSPACE_BASE)
    }

    async createWorkspace(data: CreateWorkspaceRequest): Promise<ApiResponse<{ workspace: Workspace }>> {
        return this.request<{ workspace: Workspace }>("", {
            method: "POST",
            body: JSON.stringify(data),
        }, WORKSPACE_BASE)
    }

    // Billing endpoints
    async getPlans(): Promise<ApiResponse<{ plans: Plan[] }>> {
        return this.request<{ plans: Plan[] }>("/plans", {
            method: "GET",
        }, BILLING_BASE)
    }

    async getSubscription(): Promise<ApiResponse<{ subscription: Subscription }>> {
        return this.request<{ subscription: Subscription }>("/subscription", {
            method: "GET",
        }, BILLING_BASE)
    }

    async createSubscription(data: CreateSubscriptionRequest): Promise<ApiResponse<CreateSubscriptionResponse>> {
        return this.request<CreateSubscriptionResponse>("/subscription", {
            method: "POST",
            body: JSON.stringify(data),
        }, BILLING_BASE)
    }
}

export const apiClient = new ApiClient()
