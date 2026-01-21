"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { Loader2, Building2, CreditCard, Calendar, Users, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { authClient } from "@/lib/api/auth/auth-client"
import { workspaceClient } from "@/lib/api/workspace/workspace-client"
import { billingClient } from "@/lib/api/billing/billing-client"
import { useRouter } from "next/navigation"
import type { WorkspaceDetails } from "@/lib/types/workspace"

export default function SettingsPage() {
  const { user, workspace, subscription, refreshUser, refreshWorkspace, refreshSubscription } = useAuth()
  const router = useRouter()

  // User profile state
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userEmpresa, setUserEmpresa] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  // Workspace state
  const [workspaceDetails, setWorkspaceDetails] = useState<WorkspaceDetails | null>(null)
  const [workspaceName, setWorkspaceName] = useState("")
  const [workspaceDescription, setWorkspaceDescription] = useState("")
  const [savingWorkspace, setSavingWorkspace] = useState(false)
  const [loadingWorkspace, setLoadingWorkspace] = useState(false)

  // Billing state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false)
  const [cancellingSubscription, setCancellingSubscription] = useState(false)
  const [reactivatingSubscription, setReactivatingSubscription] = useState(false)

  // Initialize user data
  useEffect(() => {
    if (user) {
      setUserName(user.nome)
      setUserEmail(user.email)
      setUserEmpresa(user.empresa)
    }
  }, [user])

  // Load workspace details
  useEffect(() => {
    if (workspace?.id) {
      loadWorkspaceDetails()
    }
  }, [workspace?.id])

  // Initialize workspace data
  useEffect(() => {
    if (workspaceDetails) {
      setWorkspaceName(workspaceDetails.name)
      setWorkspaceDescription(workspaceDetails.description || "")
    }
  }, [workspaceDetails])

  const loadWorkspaceDetails = async () => {
    if (!workspace?.id) return
    setLoadingWorkspace(true)
    try {
      const response = await workspaceClient.getWorkspace(workspace.id)
      if (response.success && response.data) {
        setWorkspaceDetails(response.data.workspace)
      }
    } catch (error) {
      toast.error("Erro ao carregar detalhes do workspace")
    } finally {
      setLoadingWorkspace(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userName.trim() || !userEmail.trim() || !userEmpresa.trim()) {
      toast.error("Preencha todos os campos")
      return
    }

    setSavingProfile(true)
    try {
      const response = await authClient.updateUser({
        nome: userName,
        email: userEmail,
        empresa: userEmpresa,
      })

      if (response.success && response.data) {
        toast.success(response.data.message || "Perfil atualizado com sucesso")
        await refreshUser()
      } else {
        toast.error(response.error?.message || "Erro ao atualizar perfil")
      }
    } catch (error) {
      toast.error("Erro ao atualizar perfil")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveWorkspace = async () => {
    if (!workspace?.id || !workspaceName.trim()) {
      toast.error("Nome do workspace é obrigatório")
      return
    }

    setSavingWorkspace(true)
    try {
      const response = await workspaceClient.updateWorkspace(workspace.id, {
        name: workspaceName,
        description: workspaceDescription || undefined,
      })

      if (response.success && response.data) {
        toast.success("Workspace atualizado com sucesso")
        await refreshWorkspace()
        await loadWorkspaceDetails()
      } else {
        toast.error(response.error?.message || "Erro ao atualizar workspace")
      }
    } catch (error) {
      toast.error("Erro ao atualizar workspace")
    } finally {
      setSavingWorkspace(false)
    }
  }

  const handleCancelSubscription = async () => {
    setCancellingSubscription(true)
    try {
      const response = await billingClient.cancelSubscription({ immediate: false })
      if (response.success && response.data) {
        toast.success(response.data.message || "Assinatura cancelada com sucesso")
        await refreshSubscription()
        setCancelDialogOpen(false)
      } else {
        toast.error(response.error?.message || "Erro ao cancelar assinatura")
      }
    } catch (error) {
      toast.error("Erro ao cancelar assinatura")
    } finally {
      setCancellingSubscription(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setReactivatingSubscription(true)
    try {
      const response = await billingClient.reactivateSubscription()
      if (response.success && response.data) {
        toast.success(response.data.message || "Assinatura reativada com sucesso")
        await refreshSubscription()
        setReactivateDialogOpen(false)
      } else {
        toast.error(response.error?.message || "Erro ao reativar assinatura")
      }
    } catch (error) {
      toast.error("Erro ao reativar assinatura")
    } finally {
      setReactivatingSubscription(false)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Ativa</Badge>
      case 'TRIALING':
        return <Badge className="bg-blue-500"><CheckCircle2 className="h-3 w-3 mr-1" />Trial</Badge>
      case 'PAST_DUE':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Atrasada</Badge>
      case 'CANCELED':
        return <Badge variant="outline">Cancelada</Badge>
      case 'INCOMPLETE':
        return <Badge variant="secondary">Incompleta</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatPrice = (cycle: 'MONTHLY' | 'YEARLY') => {
    // This would come from the plan details in a real scenario
    // For now, just show the cycle
    return cycle === 'MONTHLY' ? 'Mensal' : 'Anual'
  }

  const currentUserRole = workspaceDetails?.members.find(m => m.user.id === user?.id)?.role
  const canEditWorkspace = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas preferências e configurações da conta</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil do Usuário</CardTitle>
          <CardDescription>Informações básicas da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user ? getInitials(user.nome) : "??"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">Foto de perfil</p>
              <p className="text-sm text-muted-foreground">Avatar gerado automaticamente</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={savingProfile}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                disabled={savingProfile}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa</Label>
            <Input
              id="empresa"
              value={userEmpresa}
              onChange={(e) => setUserEmpresa(e.target.value)}
              disabled={savingProfile}
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </CardContent>
      </Card>

      {/* Workspace */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Workspace
              </CardTitle>
              <CardDescription>Informações do seu workspace</CardDescription>
            </div>
            {workspaceDetails && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {workspaceDetails.members.length} {workspaceDetails.members.length === 1 ? 'membro' : 'membros'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingWorkspace ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Nome do workspace</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={savingWorkspace || !canEditWorkspace}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-description">Descrição</Label>
                <Input
                  id="workspace-description"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  disabled={savingWorkspace || !canEditWorkspace}
                  placeholder="Descrição opcional do workspace"
                />
              </div>

              {workspaceDetails && (
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={workspaceDetails.slug}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O slug é gerado automaticamente a partir do nome
                  </p>
                </div>
              )}

              {canEditWorkspace ? (
                <Button onClick={handleSaveWorkspace} disabled={savingWorkspace}>
                  {savingWorkspace && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Atualizar workspace
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Apenas owners e admins podem editar o workspace
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Billing & Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Assinatura e Cobrança
            </CardTitle>
            <CardDescription>Gerencie seu plano e assinatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-lg">{subscription.plan.name}</p>
                  <p className="text-sm text-muted-foreground">{subscription.plan.type}</p>
                </div>
                {getStatusBadge(subscription.status)}
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ciclo de cobrança</p>
                  <p className="font-medium">{formatPrice(subscription.billingCycle)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Período atual</p>
                  <p className="font-medium flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900 dark:text-yellow-100">
                        Assinatura será cancelada
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Sua assinatura será cancelada em {formatDate(subscription.currentPeriodEnd)}.
                        Você manterá acesso até esta data.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/billing')}
              >
                Ver planos disponíveis
              </Button>

              {subscription.cancelAtPeriodEnd ? (
                <Button
                  variant="default"
                  onClick={() => setReactivateDialogOpen(true)}
                  disabled={subscription.status === 'CANCELED'}
                >
                  Reativar assinatura
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING'}
                >
                  Cancelar assinatura
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar sua assinatura? Você manterá acesso até o final do período atual
              ({subscription && formatDate(subscription.currentPeriodEnd)}), mas não será cobrado novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancellingSubscription}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancellingSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancellingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancelar assinatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Subscription Dialog */}
      <AlertDialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reativar assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja reativar sua assinatura? O cancelamento será removido e sua assinatura continuará normalmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reactivatingSubscription}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivateSubscription}
              disabled={reactivatingSubscription}
            >
              {reactivatingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reativar assinatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
