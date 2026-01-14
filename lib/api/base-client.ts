import type { ApiResponse } from "../types/common"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

// Debug: Log the configured URLs (only in development)
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 API Configuration:')
    console.log('  NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    console.log('  API_URL:', API_URL)
}

export class BaseApiClient {
    protected async request<T>(
        endpoint: string,
        options: RequestInit = {},
        baseUrl: string
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

            // If response is not ok, return the error from the API
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

    protected getApiUrl(): string {
        return API_URL
    }
}
