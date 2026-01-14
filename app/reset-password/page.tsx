"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Workflow, Lock, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [resetSuccess, setResetSuccess] = useState(false)

    useEffect(() => {
        if (!token) {
            toast.error("Token de recuperação inválido")
            router.push("/forgot-password")
        }
    }, [token, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Client-side validation
        if (newPassword.length < 8) {
            toast.error("A senha deve ter no mínimo 8 caracteres")
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error("As senhas não coincidem")
            return
        }

        if (!token) {
            toast.error("Token de recuperação inválido")
            return
        }

        setIsLoading(true)

        try {
            const response = await apiClient.resetPassword(token, newPassword)

            if (response.success && response.data) {
                setResetSuccess(true)
                toast.success(response.data.message || "Senha redefinida com sucesso")

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push("/login")
                }, 2000)
            } else if (response.error) {
                // Handle specific error codes
                switch (response.error.code) {
                    case "INVALID_TOKEN":
                        toast.error("Token inválido. Solicite um novo link de recuperação.")
                        setTimeout(() => router.push("/forgot-password"), 2000)
                        break
                    case "TOKEN_EXPIRED":
                        toast.error("Token expirado. Solicite um novo link de recuperação.")
                        setTimeout(() => router.push("/forgot-password"), 2000)
                        break
                    case "TOKEN_ALREADY_USED":
                        toast.error("Este token já foi utilizado. Solicite um novo link de recuperação.")
                        setTimeout(() => router.push("/forgot-password"), 2000)
                        break
                    case "VALIDATION_ERROR":
                        if (response.error.details && response.error.details.length > 0) {
                            toast.error(response.error.details[0].message)
                        } else {
                            toast.error("Dados inválidos")
                        }
                        break
                    default:
                        toast.error(response.error.message || "Erro ao redefinir senha")
                }
            }
        } catch (error) {
            toast.error("Erro ao redefinir senha. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return null
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                            <Workflow className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <span className="text-2xl font-semibold">TestForge</span>
                    </Link>
                </div>

                <Card className="border-border shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">Redefinir senha</CardTitle>
                        <CardDescription>
                            {resetSuccess ? "Senha alterada com sucesso" : "Digite sua nova senha"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {resetSuccess ? (
                            <div className="space-y-4">
                                <div className="rounded-lg bg-chart-2/10 border border-chart-2/20 p-4 flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-chart-2 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Senha redefinida com sucesso!</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Você será redirecionado para o login em instantes...
                                        </p>
                                    </div>
                                </div>

                                <Button className="w-full" asChild>
                                    <Link href="/login">Ir para login</Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nova senha</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="pl-10"
                                            required
                                            disabled={isLoading}
                                            minLength={8}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10"
                                            required
                                            disabled={isLoading}
                                            minLength={8}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Redefinindo...
                                        </>
                                    ) : (
                                        "Redefinir senha"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Lembrou sua senha?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                        Fazer login
                    </Link>
                </p>
            </div>
        </div>
    )
}
