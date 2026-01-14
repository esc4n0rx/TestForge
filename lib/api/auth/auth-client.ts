import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    User,
    RegisterRequest,
    LoginRequest,
    AuthResponse
} from "../../types/auth"

class AuthClient extends BaseApiClient {
    private readonly AUTH_BASE: string

    constructor() {
        super()
        this.AUTH_BASE = `${this.getApiUrl()}/api/auth`
    }

    async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
        return this.request<AuthResponse>("/register", {
            method: "POST",
            body: JSON.stringify(data),
        }, this.AUTH_BASE)
    }

    async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
        return this.request<AuthResponse>("/login", {
            method: "POST",
            body: JSON.stringify(data),
        }, this.AUTH_BASE)
    }

    async logout(): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>("/logout", {
            method: "POST",
        }, this.AUTH_BASE)
    }

    async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
        return this.request<{ user: User }>("/me", {
            method: "GET",
        }, this.AUTH_BASE)
    }

    async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>("/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
        }, this.AUTH_BASE)
    }

    async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>("/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, newPassword }),
        }, this.AUTH_BASE)
    }
}

export const authClient = new AuthClient()
