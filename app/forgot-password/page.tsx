"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Workflow, Mail, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { authClient } from "@/lib"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await authClient.forgotPassword(email)

            if (response.success && response.data) {
                setEmailSent(true)
                toast.success(response.data.message || "Se o email existir, um link de recuperação será enviado")
            } else if (response.error) {
                // Handle specific error codes
                switch (response.error.code) {
                    case "TOO_MANY_REQUESTS":
                        toast.error(response.error.message)
                        break
                    case "VALIDATION_ERROR":
                        if (response.error.details && response.error.details.length > 0) {
                            toast.error(response.error.details[0].message)
                        } else {
                            toast.error("Email inválido")
                        }
                        break
                    default:
                        toast.error(response.error.message || "Erro ao solicitar recuperação de senha")
                }
            }
        } catch (error) {
            toast.error("Erro ao solicitar recuperação de senha. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
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
                        <CardTitle className="text-2xl">Recuperar senha</CardTitle>
                        <CardDescription>
                            {emailSent
                                ? "Verifique seu email para continuar"
                                : "Digite seu email para receber o link de recuperação"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {emailSent ? (
                            <div className="space-y-4">
                                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                                    <p className="text-sm text-foreground">
                                        Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua
                                        senha.
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        O link expira em <strong>1 hora</strong>.
                                    </p>
                                </div>

                                <div className="text-center text-sm text-muted-foreground">
                                    <p>Não recebeu o email?</p>
                                    <button
                                        onClick={() => setEmailSent(false)}
                                        className="text-primary hover:underline font-medium mt-1"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>

                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="/login">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Voltar para login
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        "Enviar link de recuperação"
                                    )}
                                </Button>

                                <Button variant="outline" className="w-full bg-transparent" asChild disabled={isLoading}>
                                    <Link href="/login">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Voltar para login
                                    </Link>
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
