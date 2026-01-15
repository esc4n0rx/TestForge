"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { clientClient } from "@/lib/api/client/client-client"

interface CreateClientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspaceId: number
    onSuccess: () => void
}

export function CreateClientDialog({ open, onOpenChange, workspaceId, onSuccess }: CreateClientDialogProps) {
    const [nome, setNome] = useState("")
    const [email, setEmail] = useState("")
    const [company, setCompany] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [tempPassword, setTempPassword] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!nome || !email) {
            toast.error("Nome e email são obrigatórios")
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            toast.error("Email inválido")
            return
        }

        setIsLoading(true)

        try {
            const response = await clientClient.createClient(workspaceId, {
                nome,
                email,
                company: company || undefined,
            })

            if (response.success && response.data) {
                setTempPassword(response.data.temporaryPassword)
                toast.success(response.data.message || "Cliente criado com sucesso")
                onSuccess()
            } else if (response.error) {
                switch (response.error.code) {
                    case "BAD_REQUEST":
                        toast.error(response.error.message || "Erro ao criar cliente")
                        break
                    case "FORBIDDEN":
                        toast.error("Você não tem permissão para criar clientes")
                        break
                    default:
                        toast.error(response.error.message || "Erro ao criar cliente")
                }
            }
        } catch (error) {
            toast.error("Erro ao criar cliente. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setNome("")
        setEmail("")
        setCompany("")
        setTempPassword(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Criar cliente externo</DialogTitle>
                    <DialogDescription>
                        {tempPassword
                            ? "Cliente criado! Anote a senha temporária abaixo."
                            : "Adicione um cliente externo ao workspace. Credenciais serão enviadas por email."}
                    </DialogDescription>
                </DialogHeader>

                {tempPassword ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-border bg-muted p-4 space-y-2">
                            <p className="text-sm font-medium">Senha temporária:</p>
                            <code className="block text-lg font-mono bg-background px-3 py-2 rounded border border-border">
                                {tempPassword}
                            </code>
                            <p className="text-xs text-muted-foreground">
                                Esta senha foi enviada por email para o cliente. Guarde-a em local seguro.
                            </p>
                        </div>
                        <Button onClick={handleClose} className="w-full">
                            Fechar
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="client-nome">Nome *</Label>
                            <Input
                                id="client-nome"
                                type="text"
                                placeholder="Nome completo"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client-email">Email *</Label>
                            <Input
                                id="client-email"
                                type="email"
                                placeholder="email@cliente.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client-company">Empresa</Label>
                            <Input
                                id="client-company"
                                type="text"
                                placeholder="Nome da empresa (opcional)"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Criar cliente
                                </>
                            )}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
