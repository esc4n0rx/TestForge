"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { clientClient } from "@/lib/api/client/client-client"
import type { Client } from "@/lib/types/client"

interface EditClientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspaceId: number
    client: Client | null
    onSuccess: () => void
}

export function EditClientDialog({ open, onOpenChange, workspaceId, client, onSuccess }: EditClientDialogProps) {
    const [nome, setNome] = useState("")
    const [company, setCompany] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (client) {
            setNome(client.nome)
            setCompany(client.company || "")
        }
    }, [client])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!client) return

        if (!nome) {
            toast.error("Nome é obrigatório")
            return
        }

        setIsLoading(true)

        try {
            const response = await clientClient.updateClient(workspaceId, client.id, {
                nome,
                company: company || undefined,
            })

            if (response.success && response.data) {
                toast.success(response.data.message || "Cliente atualizado com sucesso")
                onOpenChange(false)
                onSuccess()
            } else if (response.error) {
                switch (response.error.code) {
                    case "BAD_REQUEST":
                        toast.error(response.error.message || "Erro ao atualizar cliente")
                        break
                    case "FORBIDDEN":
                        toast.error("Você não tem permissão para atualizar clientes")
                        break
                    default:
                        toast.error(response.error.message || "Erro ao atualizar cliente")
                }
            }
        } catch (error) {
            toast.error("Erro ao atualizar cliente. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar cliente</DialogTitle>
                    <DialogDescription>Atualize as informações do cliente</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-client-nome">Nome *</Label>
                        <Input
                            id="edit-client-nome"
                            type="text"
                            placeholder="Nome completo"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-client-email">Email</Label>
                        <Input
                            id="edit-client-email"
                            type="email"
                            value={client?.email || ""}
                            disabled
                            className="bg-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-client-company">Empresa</Label>
                        <Input
                            id="edit-client-company"
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
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar alterações
                            </>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
