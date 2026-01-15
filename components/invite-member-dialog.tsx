"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { teamClient } from "@/lib/api/team/team-client"
import type { Role } from "@/lib/types/team"

interface InviteMemberDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspaceId: number
    onSuccess: () => void
}

export function InviteMemberDialog({ open, onOpenChange, workspaceId, onSuccess }: InviteMemberDialogProps) {
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            toast.error("Email é obrigatório")
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
            const response = await teamClient.createInvite(workspaceId, { email, role })

            if (response.success && response.data) {
                toast.success(response.data.message || "Convite enviado com sucesso")
                setEmail("")
                setRole("MEMBER")
                onOpenChange(false)
                onSuccess()
            } else if (response.error) {
                // Handle specific error codes
                switch (response.error.code) {
                    case "LIMIT_REACHED":
                        toast.error(response.error.message || "Limite de membros atingido")
                        break
                    case "BAD_REQUEST":
                        toast.error(response.error.message || "Erro ao enviar convite")
                        break
                    case "FORBIDDEN":
                        toast.error("Você não tem permissão para convidar membros")
                        break
                    default:
                        toast.error(response.error.message || "Erro ao enviar convite")
                }
            }
        } catch (error) {
            toast.error("Erro ao enviar convite. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    const getRoleDescription = (selectedRole: string) => {
        switch (selectedRole) {
            case "ADMIN":
                return "Pode gerenciar membros, flows, templates e configurações da equipe"
            case "MEMBER":
                return "Pode criar, editar e executar flows de teste"
            default:
                return ""
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Convidar membro para equipe</DialogTitle>
                    <DialogDescription>Envie um convite por email para adicionar um novo membro</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="invite-email">Email</Label>
                        <Input
                            id="invite-email"
                            type="email"
                            placeholder="email@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="invite-role">Papel</Label>
                        <Select value={role} onValueChange={(value) => setRole(value as "ADMIN" | "MEMBER")} disabled={isLoading}>
                            <SelectTrigger id="invite-role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="MEMBER">Membro</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{getRoleDescription(role)}</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Mail className="mr-2 h-4 w-4" />
                                Enviar convite
                            </>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
