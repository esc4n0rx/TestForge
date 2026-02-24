"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Copy,
  Link2,
  Loader2,
  RefreshCw,
  ShieldBan,
  Users,
  Workflow,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import {
  clientClient,
  flowsClient,
  flowSessionsClient,
  isFlowActive,
  type Client,
  type CreateSessionsBatchResponse,
  type FlowSessionWithDetails,
  type FlowWithDetails,
  type RevokeSessionsBatchResponse,
  type SessionStatus,
} from "@/lib"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const SESSION_STATUS_OPTIONS: Array<{ value: "ALL" | SessionStatus; label: string }> = [
  { value: "ALL", label: "Todos status" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "COMPLETED", label: "COMPLETED" },
  { value: "EXPIRED", label: "EXPIRED" },
  { value: "REVOKED", label: "REVOKED" },
]

const EXPIRATION_OPTIONS = [
  { value: "1", label: "1 hora" },
  { value: "6", label: "6 horas" },
  { value: "24", label: "24 horas (1 dia)" },
  { value: "72", label: "72 horas (3 dias)" },
  { value: "168", label: "168 horas (7 dias)" },
  { value: "720", label: "720 horas (30 dias)" },
]

function formatDate(value?: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleString("pt-BR")
}

function getStatusBadgeVariant(status: SessionStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ACTIVE") return "default"
  if (status === "REVOKED") return "destructive"
  if (status === "COMPLETED") return "secondary"
  return "outline"
}

export default function SessionsPage() {
  const { workspace } = useAuth()

  const [flows, setFlows] = useState<FlowWithDetails[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [sessions, setSessions] = useState<FlowSessionWithDetails[]>([])

  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isCreatingBatch, setIsCreatingBatch] = useState(false)
  const [isRevokingBatch, setIsRevokingBatch] = useState(false)
  const [revokingSessionId, setRevokingSessionId] = useState<number | null>(null)

  const [statusFilter, setStatusFilter] = useState<"ALL" | SessionStatus>("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const [tableFlowFilter, setTableFlowFilter] = useState<string>("all")
  const [tableClientFilter, setTableClientFilter] = useState<string>("all")

  const [selectedFlowIds, setSelectedFlowIds] = useState<number[]>([])
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([])
  const [selectedSessionIds, setSelectedSessionIds] = useState<number[]>([])
  const [expiresInHours, setExpiresInHours] = useState("24")
  const [revokeOnlyActive, setRevokeOnlyActive] = useState(true)

  const [lastBatchCreateResult, setLastBatchCreateResult] = useState<CreateSessionsBatchResponse | null>(null)
  const [lastBatchRevokeResult, setLastBatchRevokeResult] = useState<RevokeSessionsBatchResponse | null>(null)

  const availableFlows = useMemo(() => {
    return flows.filter((flow) => !flow.isTemplate && flow.version?.status !== "DELETED")
  }, [flows])

  const activeFlows = useMemo(() => {
    return availableFlows.filter((flow) => isFlowActive(flow))
  }, [availableFlows])

  const filteredSessions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return sessions.filter((session) => {
      if (tableFlowFilter !== "all" && session.flow?.id !== Number(tableFlowFilter)) return false
      if (tableClientFilter !== "all" && session.client?.id !== Number(tableClientFilter)) return false

      if (!query) return true
      const haystack = [
        session.flow?.name,
        session.client?.nome,
        session.client?.email,
        session.token,
        session.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [sessions, searchTerm, tableFlowFilter, tableClientFilter])

  const selectedSessionsVisibleCount = useMemo(() => {
    const visibleIds = new Set(filteredSessions.map((s) => s.id))
    return selectedSessionIds.filter((id) => visibleIds.has(id)).length
  }, [filteredSessions, selectedSessionIds])

  useEffect(() => {
    if (!workspace) return
    void loadInitialData()
  }, [workspace])

  useEffect(() => {
    if (!workspace) return
    void loadSessions()
  }, [workspace, statusFilter])

  const loadInitialData = async () => {
    if (!workspace) return

    setIsLoadingData(true)
    try {
      const [flowsRes, clientsRes] = await Promise.all([
        flowsClient.listFlows(),
        clientClient.getClients(workspace.id),
      ])

      if (flowsRes.success && flowsRes.data) {
        setFlows(flowsRes.data.flows || [])
      } else {
        toast.error(flowsRes.error?.message || "Erro ao carregar flows")
      }

      if (clientsRes.success && clientsRes.data) {
        setClients(clientsRes.data.clients || [])
      } else {
        toast.error(clientsRes.error?.message || "Erro ao carregar clientes")
      }
    } catch (error) {
      toast.error("Erro ao carregar dados da pagina")
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadSessions = async () => {
    if (!workspace) return

    setIsLoadingSessions(true)
    try {
      const response = await flowSessionsClient.listSessions(
        workspace.id,
        statusFilter === "ALL" ? undefined : statusFilter
      )

      if (response.success && response.data) {
        setSessions(response.data.sessions || [])
      } else {
        toast.error(response.error?.message || "Erro ao carregar sessoes")
      }
    } catch (error) {
      toast.error("Erro ao carregar sessoes")
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const toggleNumberSelection = (
    value: number,
    selected: number[],
    setter: (next: number[]) => void
  ) => {
    setter(selected.includes(value) ? selected.filter((id) => id !== value) : [...selected, value])
  }

  const handleSelectAllVisibleSessions = (checked: boolean) => {
    if (!checked) {
      const visibleIds = new Set(filteredSessions.map((session) => session.id))
      setSelectedSessionIds((prev) => prev.filter((id) => !visibleIds.has(id)))
      return
    }

    const merged = new Set(selectedSessionIds)
    filteredSessions.forEach((session) => merged.add(session.id))
    setSelectedSessionIds(Array.from(merged))
  }

  const handleCreateBatch = async () => {
    if (!workspace) return
    if (selectedFlowIds.length === 0) {
      toast.error("Selecione ao menos um flow")
      return
    }
    if (selectedClientIds.length === 0) {
      toast.error("Selecione ao menos um cliente")
      return
    }

    setIsCreatingBatch(true)
    setLastBatchCreateResult(null)

    try {
      const response = await flowSessionsClient.createSessionsBatch(workspace.id, {
        flowIds: selectedFlowIds,
        clientIds: selectedClientIds,
        expiresInHours: Number(expiresInHours),
      })

      if (response.success && response.data) {
        setLastBatchCreateResult(response.data)
        const { created, conflicts, errors } = response.data.summary
        toast.success(`Associacao em massa processada (${created} criadas, ${conflicts} conflitos, ${errors} erros)`)
        await loadSessions()
      } else {
        toast.error(response.error?.message || "Erro ao criar sessoes em massa")
      }
    } catch (error) {
      toast.error("Erro ao criar sessoes em massa")
    } finally {
      setIsCreatingBatch(false)
    }
  }

  const handleRevokeSelected = async () => {
    if (!workspace) return
    if (selectedSessionIds.length === 0) {
      toast.error("Selecione ao menos uma sessao")
      return
    }

    setIsRevokingBatch(true)
    setLastBatchRevokeResult(null)

    try {
      const response = await flowSessionsClient.revokeSessionsBatch(workspace.id, {
        sessionIds: selectedSessionIds,
      })

      if (response.success && response.data) {
        setLastBatchRevokeResult(response.data)
        setSelectedSessionIds([])
        toast.success(`Revogacao em massa concluida (${response.data.summary.revoked} revogadas)`)
        await loadSessions()
      } else {
        toast.error(response.error?.message || "Erro ao revogar sessoes selecionadas")
      }
    } catch (error) {
      toast.error("Erro ao revogar sessoes selecionadas")
    } finally {
      setIsRevokingBatch(false)
    }
  }

  const handleRevokeByFilters = async () => {
    if (!workspace) return
    if (selectedClientIds.length === 0) {
      toast.error("Selecione ao menos um cliente para revogar por filtro")
      return
    }

    setIsRevokingBatch(true)
    setLastBatchRevokeResult(null)

    try {
      const response = await flowSessionsClient.revokeSessionsBatch(workspace.id, {
        clientIds: selectedClientIds,
        flowIds: selectedFlowIds.length ? selectedFlowIds : undefined,
        onlyActive: revokeOnlyActive,
      })

      if (response.success && response.data) {
        setLastBatchRevokeResult(response.data)
        toast.success(`Revogacao por filtro concluida (${response.data.summary.revoked} revogadas)`)
        await loadSessions()
      } else {
        toast.error(response.error?.message || "Erro ao revogar sessoes por filtro")
      }
    } catch (error) {
      toast.error("Erro ao revogar sessoes por filtro")
    } finally {
      setIsRevokingBatch(false)
    }
  }

  const handleRevokeSingle = async (sessionId: number) => {
    if (!workspace) return

    setRevokingSessionId(sessionId)
    try {
      const response = await flowSessionsClient.revokeSession(workspace.id, sessionId)
      if (response.success) {
        toast.success("Sessao revogada com sucesso")
        setSelectedSessionIds((prev) => prev.filter((id) => id !== sessionId))
        await loadSessions()
      } else {
        toast.error(response.error?.message || "Erro ao revogar sessao")
      }
    } catch (error) {
      toast.error("Erro ao revogar sessao")
    } finally {
      setRevokingSessionId(null)
    }
  }

  const allVisibleSelected = filteredSessions.length > 0 && selectedSessionsVisibleCount === filteredSessions.length
  const appOrigin = typeof window !== "undefined" ? window.location.origin : ""

  if (!workspace) {
    return <div className="p-6">Carregando workspace...</div>
  }

  if (isLoadingData && flows.length === 0 && clients.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sessoes</h1>
          <p className="text-muted-foreground mt-1">Gerencie sessoes de acesso dos clientes</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card key={item}>
              <CardHeader>
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessoes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sessoes de clientes em lote (associacao e revogacao) mantendo o fluxo atual.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void loadInitialData()} disabled={isLoadingData}>
            {isLoadingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Recarregar Dados
          </Button>
          <Button variant="outline" onClick={() => void loadSessions()} disabled={isLoadingSessions}>
            {isLoadingSessions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar Sessoes
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Flows ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{activeFlows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{clients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Sessoes listadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{sessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShieldBan className="h-4 w-4" />
              Selecionadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{selectedSessionIds.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Associacao e Revogacao em Massa</CardTitle>
            <CardDescription>
              Selecione flows e clientes para criar sessoes em lote. A mesma selecao pode ser usada para revogar por filtro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Flows (ativos)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFlowIds(selectedFlowIds.length === activeFlows.length ? [] : activeFlows.map((f) => f.id))}
                  >
                    {selectedFlowIds.length === activeFlows.length && activeFlows.length > 0 ? "Limpar" : "Selecionar todos"}
                  </Button>
                </div>
                <ScrollArea className="h-56 rounded-md border p-3">
                  <div className="space-y-2">
                    {activeFlows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum flow ativo encontrado.</p>
                    ) : (
                      activeFlows.map((flow) => (
                        <label key={flow.id} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50">
                          <Checkbox
                            checked={selectedFlowIds.includes(flow.id)}
                            onCheckedChange={() => toggleNumberSelection(flow.id, selectedFlowIds, setSelectedFlowIds)}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{flow.name}</p>
                            <p className="text-xs text-muted-foreground">ID {flow.id}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Clientes</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedClientIds(selectedClientIds.length === clients.length ? [] : clients.map((c) => c.id))}
                  >
                    {selectedClientIds.length === clients.length && clients.length > 0 ? "Limpar" : "Selecionar todos"}
                  </Button>
                </div>
                <ScrollArea className="h-56 rounded-md border p-3">
                  <div className="space-y-2">
                    {clients.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
                    ) : (
                      clients.map((client) => (
                        <label key={client.id} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50">
                          <Checkbox
                            checked={selectedClientIds.includes(client.id)}
                            onCheckedChange={() => toggleNumberSelection(client.id, selectedClientIds, setSelectedClientIds)}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{client.nome}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{client.email}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="expiresInHours">Expiracao</Label>
                <Select value={expiresInHours} onValueChange={setExpiresInHours}>
                  <SelectTrigger id="expiresInHours">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pares (flow x cliente)</Label>
                <div className="flex h-10 items-center rounded-md border px-3 text-sm">
                  {selectedFlowIds.length * selectedClientIds.length}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Revogacao por filtro</Label>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm">
                  <Checkbox checked={revokeOnlyActive} onCheckedChange={(checked) => setRevokeOnlyActive(Boolean(checked))} />
                  Revogar somente ACTIVE
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row">
              <Button
                onClick={handleCreateBatch}
                disabled={isCreatingBatch || selectedFlowIds.length === 0 || selectedClientIds.length === 0}
                className="md:flex-1"
              >
                {isCreatingBatch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Workflow className="mr-2 h-4 w-4" />}
                Associar em Massa
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevokeByFilters}
                disabled={isRevokingBatch || selectedClientIds.length === 0}
                className="md:flex-1"
              >
                {isRevokingBatch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldBan className="mr-2 h-4 w-4" />}
                Revogar por Clientes/Flows
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado da Ultima Operacao</CardTitle>
            <CardDescription>Resumo de associacao e revogacao em massa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {lastBatchCreateResult ? (
              <div className="rounded-md border p-3 space-y-2">
                <p className="font-medium">Associacao em massa</p>
                <p>Criadas: {lastBatchCreateResult.summary.created}</p>
                <p>Conflitos: {lastBatchCreateResult.summary.conflicts}</p>
                <p>Erros: {lastBatchCreateResult.summary.errors}</p>
                {lastBatchCreateResult.created.length > 0 && (
                  <p className="text-muted-foreground">
                    Exemplo: flow {lastBatchCreateResult.created[0].flowId} / cliente {lastBatchCreateResult.created[0].clientId}
                  </p>
                )}
              </div>
            ) : null}

            {lastBatchRevokeResult ? (
              <div className="rounded-md border p-3 space-y-2">
                <p className="font-medium">Revogacao em massa</p>
                <p>Encontradas: {lastBatchRevokeResult.summary.matched}</p>
                <p>Revogadas: {lastBatchRevokeResult.summary.revoked}</p>
                <p>Ja revogadas: {lastBatchRevokeResult.summary.alreadyRevoked}</p>
                <p>Nao encontradas: {lastBatchRevokeResult.summary.notFoundSessionIds}</p>
              </div>
            ) : null}

            {!lastBatchCreateResult && !lastBatchRevokeResult ? (
              <p className="text-muted-foreground">Nenhuma operacao em massa executada nesta sessao.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Sessoes do Workspace</CardTitle>
              <CardDescription>
                Listagem completa para gerenciar sessoes com filtros, copia de link e revogacao individual/em massa.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, flow, token..."
                className="w-[260px]"
              />
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "ALL" | SessionStatus)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tableFlowFilter} onValueChange={setTableFlowFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Todos os flows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os flows</SelectItem>
                  {availableFlows.map((flow) => (
                    <SelectItem key={flow.id} value={String(flow.id)}>
                      {flow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tableClientFilter} onValueChange={setTableClientFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredSessions.length} sessoes filtradas | {selectedSessionIds.length} selecionadas
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeSelected}
              disabled={isRevokingBatch || selectedSessionIds.length === 0}
            >
              {isRevokingBatch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldBan className="mr-2 h-4 w-4" />}
              Revogar Selecionadas
            </Button>
          </div>

          {isLoadingSessions ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((row) => (
                <Skeleton key={row} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
              Nenhuma sessao encontrada com os filtros atuais.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => handleSelectAllVisibleSessions(Boolean(checked))} />
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Flow</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Ultimo acesso</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => {
                    const isSelected = selectedSessionIds.includes(session.id)
                    const shareUrl = `${appOrigin}/client/test/${session.token}`

                    return (
                      <TableRow key={session.id} data-state={isSelected ? "selected" : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleNumberSelection(session.id, selectedSessionIds, setSelectedSessionIds)}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(session.status)}>{session.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[260px]">
                            <p className="font-medium line-clamp-1">{session.flow?.name || `Flow #${session.flowId}`}</p>
                            <p className="text-xs text-muted-foreground">ID {session.flow?.id || session.flowId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[240px]">
                            <p className="font-medium line-clamp-1">{session.client?.nome || `Cliente #${session.clientId}`}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{session.client?.email || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(session.createdAt)}</TableCell>
                        <TableCell className="text-sm">{formatDate(session.expiresAt)}</TableCell>
                        <TableCell className="text-sm">{formatDate(session.lastAccessAt)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(shareUrl)
                              toast.success("Link copiado")
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={revokingSessionId === session.id || session.status === "REVOKED"}
                            onClick={() => void handleRevokeSingle(session.id)}
                          >
                            {revokingSessionId === session.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldBan className="mr-2 h-4 w-4" />
                            )}
                            Revogar
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
