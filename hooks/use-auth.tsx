"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { User, RegisterRequest, LoginRequest, Workspace, Subscription } from "@/lib"
import { authClient, workspaceClient, billingClient } from "@/lib"
import { toast } from "sonner"

interface AuthResult {
    success: boolean
    hasWorkspace: boolean
    hasActiveSubscription: boolean
}

interface AuthContextType {
    user: User | null
    workspace: Workspace | null
    subscription: Subscription | null
    isLoading: boolean
    isAuthenticated: boolean
    hasWorkspace: boolean
    hasActiveSubscription: boolean
    login: (data: LoginRequest) => Promise<AuthResult>
    register: (data: RegisterRequest) => Promise<AuthResult>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
    refreshWorkspace: () => Promise<Workspace | null>
    refreshSubscription: () => Promise<Subscription | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [workspace, setWorkspace] = useState<Workspace | null>(null)
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Fetch workspace
    const refreshWorkspace = useCallback(async (): Promise<Workspace | null> => {
        try {
            const response = await workspaceClient.getWorkspaces()
            if (response.success && response.data && response.data.workspaces.length > 0) {
                const ws = response.data.workspaces[0]
                setWorkspace(ws)
                return ws
            } else {
                setWorkspace(null)
                return null
            }
        } catch (error) {
            setWorkspace(null)
            return null
        }
    }, [])

    // Fetch subscription
    const refreshSubscription = useCallback(async (): Promise<Subscription | null> => {
        try {
            const response = await billingClient.getSubscription()
            if (response.success && response.data) {
                const sub = response.data.subscription
                setSubscription(sub)
                return sub
            } else {
                setSubscription(null)
                return null
            }
        } catch (error) {
            setSubscription(null)
            return null
        }
    }, [])

    // Fetch current user on mount
    const refreshUser = useCallback(async () => {
        try {
            const response = await authClient.getCurrentUser()
            if (response.success && response.data) {
                setUser(response.data.user)
                // After getting user, fetch workspace and subscription
                await refreshWorkspace()
                await refreshSubscription()
            } else {
                setUser(null)
                setWorkspace(null)
                setSubscription(null)
            }
        } catch (error) {
            setUser(null)
            setWorkspace(null)
            setSubscription(null)
        } finally {
            setIsLoading(false)
        }
    }, [refreshWorkspace, refreshSubscription])

    useEffect(() => {
        refreshUser()
    }, [refreshUser])

    const login = async (data: LoginRequest): Promise<AuthResult> => {
        try {
            const response = await authClient.login(data)

            if (response.success && response.data) {
                setUser(response.data.user)
                // Fetch workspace and subscription after login
                const freshWorkspace = await refreshWorkspace()
                const freshSubscription = await refreshSubscription()
                toast.success(response.data.message || "Login realizado com sucesso")

                // Return fresh state for navigation
                return {
                    success: true,
                    hasWorkspace: !!freshWorkspace,
                    hasActiveSubscription: freshSubscription?.status === 'ACTIVE' ||
                        freshSubscription?.status === 'TRIALING' ||
                        freshSubscription?.status === 'PAST_DUE'
                }
            } else if (response.error) {
                // Handle specific error codes
                switch (response.error.code) {
                    case "INVALID_CREDENTIALS":
                        toast.error("Email ou senha inválidos")
                        break
                    case "TOO_MANY_REQUESTS":
                        toast.error(response.error.message)
                        break
                    case "VALIDATION_ERROR":
                        if (response.error.details && response.error.details.length > 0) {
                            toast.error(response.error.details[0].message)
                        } else {
                            toast.error("Dados inválidos")
                        }
                        break
                    default:
                        toast.error(response.error.message || "Erro ao fazer login")
                }
                return { success: false, hasWorkspace: false, hasActiveSubscription: false }
            }
            return { success: false, hasWorkspace: false, hasActiveSubscription: false }
        } catch (error) {
            toast.error("Erro ao fazer login. Tente novamente.")
            return { success: false, hasWorkspace: false, hasActiveSubscription: false }
        }
    }

    const register = async (data: RegisterRequest): Promise<AuthResult> => {
        try {
            const response = await authClient.register(data)

            if (response.success && response.data) {
                setUser(response.data.user)
                // Fetch workspace and subscription after register
                const freshWorkspace = await refreshWorkspace()
                const freshSubscription = await refreshSubscription()
                toast.success(response.data.message || "Usuário cadastrado com sucesso")

                // Return fresh state for navigation
                return {
                    success: true,
                    hasWorkspace: !!freshWorkspace,
                    hasActiveSubscription: freshSubscription?.status === 'ACTIVE' ||
                        freshSubscription?.status === 'TRIALING' ||
                        freshSubscription?.status === 'PAST_DUE'
                }
            } else if (response.error) {
                // Handle specific error codes
                switch (response.error.code) {
                    case "EMAIL_ALREADY_EXISTS":
                        toast.error("Este email já está cadastrado")
                        break
                    case "TOO_MANY_REQUESTS":
                        toast.error(response.error.message)
                        break
                    case "VALIDATION_ERROR":
                        if (response.error.details && response.error.details.length > 0) {
                            // Show first validation error
                            toast.error(response.error.details[0].message)
                        } else {
                            toast.error("Dados inválidos")
                        }
                        break
                    default:
                        toast.error(response.error.message || "Erro ao criar conta")
                }
                return { success: false, hasWorkspace: false, hasActiveSubscription: false }
            }
            return { success: false, hasWorkspace: false, hasActiveSubscription: false }
        } catch (error) {
            toast.error("Erro ao criar conta. Tente novamente.")
            return { success: false, hasWorkspace: false, hasActiveSubscription: false }
        }
    }

    const logout = async () => {
        try {
            const response = await authClient.logout()
            setUser(null)
            setWorkspace(null)
            setSubscription(null)

            if (response.success) {
                toast.success("Logout realizado com sucesso")
            }

            router.push("/")
        } catch (error) {
            // Even if API fails, clear local state and redirect
            setUser(null)
            setWorkspace(null)
            setSubscription(null)
            router.push("/")
        }
    }

    const hasWorkspace = !!workspace
    const hasActiveSubscription = subscription?.status === 'ACTIVE' ||
        subscription?.status === 'TRIALING' ||
        subscription?.status === 'PAST_DUE'

    const value: AuthContextType = {
        user,
        workspace,
        subscription,
        isLoading,
        isAuthenticated: !!user,
        hasWorkspace,
        hasActiveSubscription,
        login,
        register,
        logout,
        refreshUser,
        refreshWorkspace,
        refreshSubscription,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
