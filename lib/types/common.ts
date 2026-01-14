// Common types shared across the application

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
