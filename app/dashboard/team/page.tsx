"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { UserPlus, MoreVertical, Mail, RefreshCw, X, Loader2, Users, UserCog, Building2, KeyRound, Trash2, Edit } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { teamClient } from "@/lib/api/team/team-client"
import { clientClient } from "@/lib/api/client/client-client"
import { InviteMemberDialog } from "@/components/invite-member-dialog"
import { CreateClientDialog } from "@/components/create-client-dialog"
import { EditClientDialog } from "@/components/edit-client-dialog"
import type { WorkspaceMember, WorkspaceInvite, Role } from "@/lib/types/team"
import type { Client } from "@/lib/types/client"

export default function TeamPage() {
  const { workspace, user } = useAuth()
  const [activeTab, setActiveTab] = useState("members")

  // Members state
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  // Invites state
  const [invites, setInvites] = useState<WorkspaceInvite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)

  // Clients state
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false)
  const [editClientDialogOpen, setEditClientDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Alert dialog states
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'member' | 'invite' | 'client'; id: number; userId?: number } | null>(null)
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; client: Client } | null>(null)

  const currentUserRole = members.find(m => m.userId === user?.id)?.role
  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

  useEffect(() => {
    if (workspace?.id) {
      loadMembers()
      loadInvites()
      loadClients()
    }
  }, [workspace?.id])

  const loadMembers = async () => {
    if (!workspace?.id) return
    setLoadingMembers(true)
    try {
      const response = await teamClient.getMembers(workspace.id)
      if (response.success && response.data) {
        setMembers(response.data.members)
      }
    } catch (error) {
      toast.error("Erro ao carregar membros")
    } finally {
      setLoadingMembers(false)
    }
  }

  const loadInvites = async () => {
    if (!workspace?.id) return
    setLoadingInvites(true)
    try {
      const response = await teamClient.getInvites(workspace.id)
      if (response.success && response.data) {
        setInvites(response.data.invites)
      }
    } catch (error) {
      toast.error("Erro ao carregar convites")
    } finally {
      setLoadingInvites(false)
    }
  }

  const loadClients = async () => {
    if (!workspace?.id) return
    setLoadingClients(true)
    try {
      const response = await clientClient.getClients(workspace.id)
      if (response.success && response.data) {
        setClients(response.data.clients)
      }
    } catch (error) {
      toast.error("Erro ao carregar clientes")
    } finally {
      setLoadingClients(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!workspace?.id || !deleteDialog || deleteDialog.type !== 'member' || !deleteDialog.userId) return

    try {
      const response = await teamClient.removeMember(workspace.id, deleteDialog.userId)
      if (response.success) {
        toast.success("Membro removido com sucesso")
        loadMembers()
      } else {
        toast.error(response.error?.message || "Erro ao remover membro")
      }
    } catch (error) {
      toast.error("Erro ao remover membro")
    } finally {
      setDeleteDialog(null)
    }
  }

  const handleCancelInvite = async () => {
    if (!workspace?.id || !deleteDialog || deleteDialog.type !== 'invite') return

    try {
      const response = await teamClient.cancelInvite(workspace.id, deleteDialog.id)
      if (response.success) {
        toast.success("Convite cancelado com sucesso")
        loadInvites()
      } else {
        toast.error(response.error?.message || "Erro ao cancelar convite")
      }
    } catch (error) {
      toast.error("Erro ao cancelar convite")
    } finally {
      setDeleteDialog(null)
    }
  }

  const handleResendInvite = async (inviteId: number) => {
    try {
      const response = await teamClient.resendInvite(inviteId)
      if (response.success) {
        toast.success("Convite reenviado com sucesso")
      } else {
        toast.error(response.error?.message || "Erro ao reenviar convite")
      }
    } catch (error) {
      toast.error("Erro ao reenviar convite")
    }
  }

  const handleDeleteClient = async () => {
    if (!workspace?.id || !deleteDialog || deleteDialog.type !== 'client') return

    try {
      const response = await clientClient.deleteClient(workspace.id, deleteDialog.id)
      if (response.success) {
        toast.success("Cliente removido com sucesso")
        loadClients()
      } else {
        toast.error(response.error?.message || "Erro ao remover cliente")
      }
    } catch (error) {
      toast.error("Erro ao remover cliente")
    } finally {
      setDeleteDialog(null)
    }
  }

  const handleResetPassword = async () => {
    if (!workspace?.id || !resetPasswordDialog) return

    try {
      const response = await clientClient.resetClientPassword(workspace.id, resetPasswordDialog.client.id)
      if (response.success && response.data) {
        toast.success(response.data.message || "Senha resetada com sucesso")
      } else {
        toast.error(response.error?.message || "Erro ao resetar senha")
      }
    } catch (error) {
      toast.error("Erro ao resetar senha")
    } finally {
      setResetPasswordDialog(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'OWNER': return 'default'
      case 'ADMIN': return 'secondary'
      case 'MEMBER': return 'outline'
    }
  }

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'OWNER': return 'Owner'
      case 'ADMIN': return 'Admin'
      case 'MEMBER': return 'Membro'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary'
      case 'ACCEPTED': return 'default'
      case 'EXPIRED': return 'outline'
      case 'CANCELED': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente'
      case 'ACCEPTED': return 'Aceito'
      case 'EXPIRED': return 'Expirado'
      case 'CANCELED': return 'Cancelado'
      case 'REJECTED': return 'Recusado'
      default: return status
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipe</h1>
          <p className="text-muted-foreground mt-1">Gerencie membros, convites e clientes do workspace</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Membros
          </TabsTrigger>
          <TabsTrigger value="invites">
            <Mail className="h-4 w-4 mr-2" />
            Convites
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Building2 className="h-4 w-4 mr-2" />
            Clientes
          </TabsTrigger>
        </TabsList>

        {/* MEMBERS TAB */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Membros da Equipe ({members.length})</CardTitle>
                <CardDescription>Pessoas com acesso ao workspace</CardDescription>
              </div>
              {canManage && (
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convidar membro
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum membro encontrado
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(member.user.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user.nome}</p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {getRoleLabel(member.role)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(member.joinedAt).toLocaleDateString('pt-BR')}
                        </span>
                        {canManage && member.role !== 'OWNER' && member.userId !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, type: 'member', id: member.id, userId: member.userId })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVITES TAB */}
        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Convites Pendentes ({invites.filter(i => i.status === 'PENDING').length})</CardTitle>
              <CardDescription>Convites enviados aguardando aceitação</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInvites ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : invites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum convite encontrado
                </div>
              ) : (
                <div className="space-y-3">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-medium">{invite.email}</p>
                          <Badge variant={getRoleBadgeVariant(invite.role)}>
                            {getRoleLabel(invite.role)}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(invite.status)}>
                            {getStatusLabel(invite.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Convidado por {invite.invitedBy.nome} em {new Date(invite.invitedAt).toLocaleDateString('pt-BR')}
                          {invite.status === 'PENDING' && ` • Expira em ${new Date(invite.expiresAt).toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                      {canManage && invite.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendInvite(invite.id)}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reenviar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, type: 'invite', id: invite.id })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLIENTS TAB */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Clientes Externos ({clients.length})</CardTitle>
                <CardDescription>Colaboradores externos com acesso limitado</CardDescription>
              </div>
              {canManage && (
                <Button onClick={() => setCreateClientDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar cliente
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum cliente encontrado
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-chart-2 text-white">
                            {getInitials(client.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.nome}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                          {client.company && (
                            <p className="text-xs text-muted-foreground mt-0.5">{client.company}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedClient(client)
                                setEditClientDialogOpen(true)
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setResetPasswordDialog({ open: true, client })}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Resetar senha
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, type: 'client', id: client.id })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        workspaceId={workspace?.id || 0}
        onSuccess={loadInvites}
      />

      <CreateClientDialog
        open={createClientDialogOpen}
        onOpenChange={setCreateClientDialogOpen}
        workspaceId={workspace?.id || 0}
        onSuccess={loadClients}
      />

      <EditClientDialog
        open={editClientDialogOpen}
        onOpenChange={setEditClientDialogOpen}
        workspaceId={workspace?.id || 0}
        client={selectedClient}
        onSuccess={loadClients}
      />

      {/* Delete/Cancel Alert Dialog */}
      <AlertDialog open={deleteDialog?.open || false} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.type === 'member' && 'Tem certeza que deseja remover este membro? Esta ação não pode ser desfeita.'}
              {deleteDialog?.type === 'invite' && 'Tem certeza que deseja cancelar este convite?'}
              {deleteDialog?.type === 'client' && 'Tem certeza que deseja remover este cliente? Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog?.type === 'member') handleRemoveMember()
                else if (deleteDialog?.type === 'invite') handleCancelInvite()
                else if (deleteDialog?.type === 'client') handleDeleteClient()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Alert Dialog */}
      <AlertDialog open={resetPasswordDialog?.open || false} onOpenChange={(open) => !open && setResetPasswordDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha</AlertDialogTitle>
            <AlertDialogDescription>
              Uma nova senha temporária será gerada e enviada por email para {resetPasswordDialog?.client.email}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>
              Resetar senha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
