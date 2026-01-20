"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  MoreVertical,
  Share2,
  Trash2,
  ExternalLink,
  Plus,
  Power,
  PowerOff,
  Loader2,
  Sparkles,
  Filter,
  List,
  Copy,
} from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import {
  flowsClient,
  flowSessionsClient,
  type FlowWithDetails,
  type FlowType,
  type FlowEnvironment,
  type Client,
  canActivateFlow,
  getMaxFlowsDisplay,
  getFlowVersion,
  getVersionId,
  getFlowCards,
  isFlowActive,
} from "@/lib"

export default function FlowsPage() {
  const router = useRouter()
  const { subscription, workspace } = useAuth()
  const [flows, setFlows] = useState<FlowWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedFlow, setSelectedFlow] = useState<FlowWithDetails | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [flowToDelete, setFlowToDelete] = useState<FlowWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [sessionUrl, setSessionUrl] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [expirationHours, setExpirationHours] = useState<string>("24")

  // Active sessions modal
  const [showSessionsModal, setShowSessionsModal] = useState(false)
  const [flowSessions, setFlowSessions] = useState<any[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)


  // Filters
  const [typeFilter, setTypeFilter] = useState<FlowType | "ALL">("ALL")
  const [environmentFilter, setEnvironmentFilter] = useState<FlowEnvironment | "ALL">("ALL")

  useEffect(() => {
    loadFlows()
  }, [typeFilter, environmentFilter])

  // Auto-refresh flows when page becomes visible (e.g., navigating back from editor)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadFlows()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [typeFilter, environmentFilter])

  const loadFlows = async () => {
    setIsLoading(true)
    try {
      const filters: any = {}

      if (typeFilter !== "ALL") filters.type = typeFilter
      if (environmentFilter !== "ALL") filters.environment = environmentFilter

      const response = await flowsClient.listFlows(filters)

      if (response.success && response.data) {
        // Filter out DELETED flows on the frontend
        const activeFlows = response.data.flows.filter(
          (flow) => flow.version?.status !== 'DELETED'
        )
        setFlows(activeFlows)
      } else {
        toast.error(response.error?.message || "Erro ao carregar flows")
      }
    } catch (error) {
      toast.error("Erro ao carregar flows")
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async (flow: FlowWithDetails) => {
    setSelectedFlow(flow)
    setSessionUrl(null)
    setSelectedClientId("")
    setExpirationHours("24")
    setShareDialogOpen(true)

    // Load clients for selection
    if (workspace) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workspace/${workspace.id}/clients`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setClients(data.data.clients || [])
          }
        }
      } catch (error) {
        console.error('Error loading clients:', error)
      }
    }
  }

  const handleCreateSession = async () => {
    if (!selectedFlow || !workspace || !selectedClientId) {
      toast.error("Selecione um cliente")
      return
    }

    setIsCreatingSession(true)
    try {
      const response = await flowSessionsClient.createSession(workspace.id, {
        flowId: selectedFlow.id,
        clientId: Number(selectedClientId),
        expiresInHours: Number(expirationHours)
      })

      if (response.success && response.data) {
        // Use /client/login as the share URL - clients will see their sessions after login
        setSessionUrl(`${window.location.origin}/client/login`)
        toast.success("Sessão criada com sucesso!")
      } else {
        // Check if session already exists
        if (response.error?.code === "SESSION_ALREADY_EXISTS") {
          toast.info("Cliente já possui sessão ativa para este flow")
          setShareDialogOpen(false)
          await loadActiveSessions(selectedFlow)
          setShowSessionsModal(true)
        } else {
          toast.error(response.error?.message || "Erro ao criar sessão")
        }
      }
    } catch (error) {
      toast.error("Erro ao criar sessão")
    } finally {
      setIsCreatingSession(false)
    }
  }

  const loadActiveSessions = async (flow: FlowWithDetails) => {
    if (!workspace) return

    setSelectedFlow(flow)
    setIsLoadingSessions(true)
    try {
      const response = await flowSessionsClient.listFlowSessions(workspace.id, flow.id, "ACTIVE")

      if (response.success && response.data) {
        setFlowSessions(response.data.sessions || [])
      } else {
        toast.error(response.error?.message || "Erro ao carregar sessões")
      }
    } catch (error) {
      toast.error("Erro ao carregar sessões")
    } finally {
      setIsLoadingSessions(false)
    }
  }


  const handleDeleteClick = (flow: FlowWithDetails) => {
    setFlowToDelete(flow)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!flowToDelete) return

    setIsDeleting(true)
    try {
      const response = await flowsClient.deleteFlow(flowToDelete.id)

      if (response.success) {
        toast.success("Flow excluído com sucesso")
        setDeleteDialogOpen(false)
        setFlowToDelete(null)
        await loadFlows()
      } else {
        toast.error(response.error?.message || "Erro ao excluir flow")
      }
    } catch (error) {
      toast.error("Erro ao excluir flow")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActivation = async (flow: FlowWithDetails) => {
    const isActive = isFlowActive(flow)

    if (!isActive) {
      // Check if can activate
      const activeFlowsCount = flows.filter((f) => isFlowActive(f)).length
      const planCode = subscription?.plan.code || "forge_start"

      if (!canActivateFlow(activeFlowsCount, planCode)) {
        const maxFlows = getMaxFlowsDisplay(planCode)
        toast.error(`Limite de ${maxFlows} flows ativos atingido. Faça upgrade do plano.`)
        return
      }
    }

    try {
      // Fetch fresh flow data before activation to ensure we have the latest version
      const freshFlowResponse = await flowsClient.getFlow(flow.id)

      if (!freshFlowResponse.success || !freshFlowResponse.data) {
        toast.error(freshFlowResponse.error?.message || "Erro ao buscar dados do flow")
        return
      }

      const freshFlow = freshFlowResponse.data.flow

      // Verify flow has a version before attempting activation
      if (!freshFlow.version) {
        toast.error("Flow não possui versão. Salve o flow antes de ativar.")
        return
      }

      const response = isActive
        ? await flowsClient.deactivateFlow(freshFlow.id)
        : await flowsClient.activateFlow(freshFlow.id)

      if (response.success) {
        toast.success(isActive ? "Flow desativado" : "Flow ativado")
        await loadFlows()
      } else {
        toast.error(response.error?.message || "Erro ao alterar status do flow")
      }
    } catch (error) {
      console.error("Error toggling flow activation:", error)
      toast.error("Erro ao alterar status do flow")
    }
  }

  const getFlowTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TEST: "Teste",
      PROGRAM_FLOW: "Programa",
      PROCESS: "Processo",
    }
    return labels[type] || type
  }

  const getEnvironmentLabel = (env: string) => {
    const labels: Record<string, string> = {
      NONE: "Nenhum",
      DEV: "Dev",
      QA: "QA",
      STAGING: "Staging",
      PRODUCTION: "Prod",
    }
    return labels[env] || env
  }


  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Flows</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus cenários de teste</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const activeFlowsCount = flows.filter((f) => isFlowActive(f)).length
  const maxFlows = subscription ? getMaxFlowsDisplay(subscription.plan.code) : "10"
  const canCreateMore = subscription && workspace && canActivateFlow(activeFlowsCount, subscription.plan.code)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flows</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus cenários de teste</p>
          <p className="text-sm text-muted-foreground mt-1">
            {activeFlowsCount} / {maxFlows} flows ativos
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/editor/new">
            <Plus className="mr-2 h-5 w-5" />
            Novo Flow
          </Link>
        </Button>
      </div>

      {!canCreateMore && subscription && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium">Limite de flows ativos atingido</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Você atingiu o limite de {maxFlows} flows ativos do plano {subscription.plan.name}.
                  Você pode criar mais flows, mas não poderá ativá-los. Faça upgrade para flows ilimitados.
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Ver Planos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as FlowType | "ALL")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os tipos</SelectItem>
            <SelectItem value="TEST">Teste</SelectItem>
            <SelectItem value="PROGRAM_FLOW">Programa</SelectItem>
            <SelectItem value="PROCESS">Processo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={environmentFilter} onValueChange={(v) => setEnvironmentFilter(v as FlowEnvironment | "ALL")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ambiente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos ambientes</SelectItem>
            <SelectItem value="NONE">Nenhum</SelectItem>
            <SelectItem value="DEV">Desenvolvimento</SelectItem>
            <SelectItem value="QA">QA</SelectItem>
            <SelectItem value="STAGING">Staging</SelectItem>
            <SelectItem value="PRODUCTION">Produção</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {flows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Plus className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhum flow criado</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              Comece criando seu primeiro flow de teste para documentar seus cenários
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/editor/new">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro flow
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => {
            const isActive = isFlowActive(flow)
            const version = getFlowVersion(flow)
            return (
              <Card key={flow.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-2">{flow.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {getFlowTypeLabel(flow.type)}
                        </Badge>
                        {flow.environment !== "NONE" && (
                          <Badge variant="outline" className="text-xs">
                            {getEnvironmentLabel(flow.environment)}
                          </Badge>
                        )}
                        <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                          {version?.status || "DRAFT"}
                        </Badge>
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/editor/${flow.id}`}>Abrir</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActivation(flow)}>
                          {isActive ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        {isActive && (
                          <>
                            <DropdownMenuItem onClick={() => handleShare(flow)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              Compartilhar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              loadActiveSessions(flow)
                              setShowSessionsModal(true)
                            }}>
                              <List className="mr-2 h-4 w-4" />
                              Ver Sessões Ativas
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(flow)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {getFlowCards(flow).length} cards
                    </span>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/editor/${flow.id}`}>
                        Abrir
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compartilhar Flow</DialogTitle>
            <DialogDescription>
              Crie uma sessão de acesso para um cliente executar este flow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!sessionUrl ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={String(client.id)}>
                          {client.nome} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clients.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum cliente cadastrado. Cadastre clientes primeiro.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiration">Expiração</Label>
                  <Select value={expirationHours} onValueChange={setExpirationHours}>
                    <SelectTrigger id="expiration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="6">6 horas</SelectItem>
                      <SelectItem value="24">24 horas (1 dia)</SelectItem>
                      <SelectItem value="72">72 horas (3 dias)</SelectItem>
                      <SelectItem value="168">168 horas (7 dias)</SelectItem>
                      <SelectItem value="720">720 horas (30 dias)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreateSession}
                  disabled={isCreatingSession || !selectedClientId}
                  className="w-full"
                >
                  {isCreatingSession ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando sessão...
                    </>
                  ) : (
                    "Criar Sessão"
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Link de Acesso</Label>
                  <div className="flex gap-2">
                    <Input value={sessionUrl} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(sessionUrl)
                        toast.success("Link copiado!")
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h4 className="font-semibold text-sm mb-2">✅ Sessão criada com sucesso!</h4>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe este link com o cliente. Ele terá acesso ao flow por {expirationHours} horas.
                    O cliente poderá executar o flow, anexar evidências e adicionar observações.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSessionUrl(null)
                    setSelectedClientId("")
                  }}
                  className="w-full"
                >
                  Criar Nova Sessão
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Flow</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o flow "{flowToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Active Sessions Modal */}
      <Dialog open={showSessionsModal} onOpenChange={setShowSessionsModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sessões Ativas - {selectedFlow?.name}</DialogTitle>
            <DialogDescription>
              Visualize e gerencie as sessões ativas deste flow
            </DialogDescription>
          </DialogHeader>

          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : flowSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma sessão ativa encontrada</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {flowSessions.map((session: any) => (
                <Card key={session.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">{session.client?.nome || session.client?.name}</p>
                          <p className="text-sm text-muted-foreground">{session.client?.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Expira em: {new Date(session.expiresAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant={session.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={`${window.location.origin}/client/test/${session.token}`}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/client/test/${session.token}`)
                            toast.success("Link copiado!")
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
