"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Workflow, Building2, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

export default function CreateWorkspacePage() {
    const router = useRouter()
    const { user, refreshWorkspace, isLoading: authLoading } = useAuth()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // Redirect if not authenticated
    if (!authLoading && !user) {
        router.push("/login")
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Client-side validation
        if (name.length < 2) {
            toast.error("O nome do workspace deve ter no mínimo 2 caracteres")
            return
        }

        setIsLoading(true)

        try {
            const response = await apiClient.createWorkspace({
                name,
                description: description || undefined,
            })

            if (response.success && response.data) {
                toast.success("Workspace criado com sucesso!")
                // Refresh workspace state
                await refreshWorkspace()
                // Redirect to subscription page
                router.push("/subscribe")
            } else if (response.error) {
                // Handle specific error codes
                switch (response.error.code) {
                    case "WORKSPACE_ALREADY_EXISTS":
                        toast.error("Você já possui um workspace")
                        // If workspace already exists, refresh and redirect to subscribe
                        await refreshWorkspace()
                        router.push("/subscribe")
                        break
                    case "VALIDATION_ERROR":
                        if (response.error.details && response.error.details.length > 0) {
                            toast.error(response.error.details[0].message)
                        } else {
                            toast.error("Dados inválidos")
                        }
                        break
                    case "UNAUTHORIZED":
                        toast.error("Sessão expirada. Faça login novamente.")
                        router.push("/login")
                        break
                    default:
                        toast.error(response.error.message || "Erro ao criar workspace")
                }
            }
        } catch (error) {
            toast.error("Erro ao criar workspace. Tente novamente.")
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
                        <CardTitle className="text-2xl">Crie seu workspace</CardTitle>
                        <CardDescription>
                            Configure o workspace da sua empresa para começar a criar fluxos de teste
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do workspace</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Acme Inc"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10"
                                        required
                                        disabled={isLoading}
                                        minLength={2}
                                        maxLength={100}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Este será o nome da sua empresa ou equipe
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição (opcional)</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="description"
                                        type="text"
                                        placeholder="Workspace para testes automatizados"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="pl-10"
                                        disabled={isLoading}
                                        maxLength={500}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Criando workspace...
                                    </>
                                ) : (
                                    "Criar workspace"
                                )}
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Passo 1 de 2</span>
                            </div>
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                            Após criar o workspace, você poderá escolher um plano de assinatura
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
