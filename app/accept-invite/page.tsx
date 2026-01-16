"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Workflow, Mail, Lock, User, Building2, Loader2, AlertCircle, CheckCircle2, Users } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { authClient } from "@/lib"
import { toast } from "sonner"
import type { InviteInfo } from "@/lib/types/auth"

function AcceptInviteContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { register } = useAuth()

    const [token, setToken] = useState<string | null>(null)
    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
    const [isLoadingInvite, setIsLoadingInvite] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form fields
    const [name, setName] = useState("")
    const [password, setPassword] = useState("")
    const [company, setCompany] = useState("")

    // Fetch invite info on mount
    useEffect(() => {
        const inviteToken = searchParams.get("token")

        if (!inviteToken) {
            setIsLoadingInvite(false)
            return
        }

        setToken(inviteToken)

        const fetchInviteInfo = async () => {
            try {
                const response = await authClient.getInviteInfo(inviteToken)

                if (response.success && response.data) {
                    setInviteInfo(response.data)
                } else if (response.error) {
                    toast.error(response.error.message || "Erro ao buscar informações do convite")
                    setInviteInfo({ valid: false, message: response.error.message })
                }
            } catch (error) {
                toast.error("Erro ao buscar informações do convite")
                setInviteInfo({ valid: false, message: "Erro ao buscar informações do convite" })
            } finally {
                setIsLoadingInvite(false)
            }
        }

        fetchInviteInfo()
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!token || !inviteInfo?.valid || !inviteInfo.invite) {
            toast.error("Convite inválido")
            return
        }

        // Client-side validation
        if (password.length < 8) {
            toast.error("A senha deve ter no mínimo 8 caracteres")
            return
        }

        if (name.length < 2) {
            toast.error("O nome deve ter no mínimo 2 caracteres")
            return
        }

        if (company.length < 2) {
            toast.error("O nome da empresa deve ter no mínimo 2 caracteres")
            return
        }

        setIsSubmitting(true)

        try {
            const result = await register({
                email: inviteInfo.invite.email,
                nome: name,
                senha: password,
                empresa: company,
                inviteToken: token,
            })

            if (result.success) {
                toast.success(`Bem-vindo ao workspace ${inviteInfo.invite.workspaceName}!`)
                // User should be automatically added to workspace, redirect to dashboard
                router.push("/dashboard")
            }
        } catch (error) {
            toast.error("Erro ao aceitar convite. Tente novamente.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Loading state
    if (isLoadingInvite) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md border-border shadow-2xl">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Carregando informações do convite...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // No token provided
    if (!token) {
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
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                                    <AlertCircle className="h-6 w-6 text-destructive" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="font-semibold text-lg">Token não encontrado</h3>
                                    <p className="text-sm text-muted-foreground">
                                        O link de convite está incompleto. Verifique o link recebido por email.
                                    </p>
                                </div>
                                <Button asChild className="mt-4">
                                    <Link href="/login">Ir para Login</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Invalid invite
    if (!inviteInfo?.valid) {
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
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                                    <AlertCircle className="h-6 w-6 text-destructive" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="font-semibold text-lg">Convite inválido</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {inviteInfo?.message || "Este convite não é válido, expirou ou já foi utilizado."}
                                    </p>
                                </div>
                                <Button asChild className="mt-4">
                                    <Link href="/login">Ir para Login</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Valid invite - show registration form
    const invite = inviteInfo.invite!

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

                {/* Invite Info Card */}
                <Card className="border-border shadow-lg mb-6 bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    <p className="text-sm font-medium">Você foi convidado!</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">{invite.invitedBy}</span> convidou você para participar do workspace{" "}
                                    <span className="font-medium text-foreground">{invite.workspaceName}</span> como{" "}
                                    <span className="font-medium text-foreground">{invite.role === "ADMIN" ? "Administrador" : "Membro"}</span>.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Registration Form */}
                <Card className="border-border shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">Complete seu cadastro</CardTitle>
                        <CardDescription>
                            Preencha seus dados para aceitar o convite
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={invite.email}
                                        className="pl-10 bg-muted"
                                        disabled
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Email do convite (não pode ser alterado)</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nome completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="João Silva"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10"
                                        required
                                        disabled={isSubmitting}
                                        minLength={2}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                        disabled={isSubmitting}
                                        minLength={8}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="company">Empresa</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="company"
                                        type="text"
                                        placeholder="Nome da empresa"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        className="pl-10"
                                        required
                                        disabled={isSubmitting}
                                        minLength={2}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Aceitando convite...
                                    </>
                                ) : (
                                    "Aceitar convite e criar conta"
                                )}
                            </Button>
                        </form>

                        <p className="text-center text-sm text-muted-foreground">
                            Já tem uma conta?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Fazer login
                            </Link>
                        </p>
                    </CardContent>
                </Card>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Ao aceitar o convite, você concorda com nossos{" "}
                    <Link href="#" className="underline hover:text-foreground">
                        Termos de Serviço
                    </Link>
                    {" "}e{" "}
                    <Link href="#" className="underline hover:text-foreground">
                        Política de Privacidade
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md border-border shadow-2xl">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Carregando...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        }>
            <AcceptInviteContent />
        </Suspense>
    )
}
