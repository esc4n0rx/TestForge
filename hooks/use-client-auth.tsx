"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { clientAuthClient, type ClientAuthData } from "@/lib"

interface ClientAuthContextType {
    client: ClientAuthData | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, senha: string, workspaceSlug: string) => Promise<boolean>
    logout: () => Promise<void>
    refreshClient: () => Promise<void>
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined)

export function ClientAuthProvider({ children }: { children: ReactNode }) {
    const [client, setClient] = useState<ClientAuthData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const refreshClient = async () => {
        try {
            const response = await clientAuthClient.getCurrentClient()
            if (response.success && response.data) {
                setClient(response.data)
            } else {
                setClient(null)
            }
        } catch (error) {
            setClient(null)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        refreshClient()
    }, [])

    const login = async (email: string, senha: string, workspaceSlug: string): Promise<boolean> => {
        try {
            const response = await clientAuthClient.login({ email, senha, workspaceSlug })
            if (response.success && response.data) {
                await refreshClient()
                return true
            }
            return false
        } catch (error) {
            return false
        }
    }

    const logout = async () => {
        try {
            await clientAuthClient.logout()
        } finally {
            setClient(null)
        }
    }

    return (
        <ClientAuthContext.Provider
            value={{
                client,
                isLoading,
                isAuthenticated: !!client,
                login,
                logout,
                refreshClient,
            }}
        >
            {children}
        </ClientAuthContext.Provider>
    )
}

export function useClientAuth() {
    const context = useContext(ClientAuthContext)
    if (context === undefined) {
        throw new Error("useClientAuth must be used within a ClientAuthProvider")
    }
    return context
}
