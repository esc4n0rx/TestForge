"use client"

import { useEffect, useMemo, useState } from "react"
import { Cell, Pie, PieChart } from "recharts"
import { Plus, MoreVertical, FolderKanban, Loader2, Link as LinkIcon, Unlink, Archive, RotateCcw, Building2, Activity } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { canUseProjects, flowsClient, getFlowCards, projectsClient, type FlowWithDetails, type Project, type ProjectStatus } from "@/lib"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
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

type StatusFilter = "ALL" | ProjectStatus

const chartConfig = {
  success: { label: "Sucesso", color: "hsl(var(--chart-2))" },
  error: { label: "Erro", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export default function ProjectsPage() {
  const { subscription, isLoading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [flows, setFlows] = useState<FlowWithDetails[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [linkedFlows, setLinkedFlows] = useState<FlowWithDetails[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")

  const [loading, setLoading] = useState(true)
  const [loadingFlows, setLoadingFlows] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [manageDialogOpen, setManageDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)

  const [projectToArchive, setProjectToArchive] = useState<Project | null>(null)
  const [projectToRestore, setProjectToRestore] = useState<Project | null>(null)
  const [selectedFlowId, setSelectedFlowId] = useState<string>("")
  const [formData, setFormData] = useState({ name: "", client: "", description: "" })

  const projectsEnabled = useMemo(() => {
    return canUseProjects(subscription)
  }, [subscription])

  useEffect(() => {
    if (authLoading) return
    if (!projectsEnabled) {
      setLoading(false)
      return
    }
    void loadProjects(statusFilter)
    void loadFlows()
  }, [authLoading, projectsEnabled])

  useEffect(() => {
    if (authLoading) return
    if (!projectsEnabled) return
    void loadProjects(statusFilter)
  }, [authLoading, statusFilter, projectsEnabled])

  const loadProjects = async (filter: StatusFilter) => {
    setLoading(true)
    try {
      const response = await projectsClient.listProjects(filter === "ALL" ? undefined : filter)
      if (response.success && response.data) {
        setProjects(response.data.projects || [])
      } else {
        toast.error(response.error?.message || "Erro ao carregar projetos")
      }
    } catch {
      toast.error("Erro ao carregar projetos")
    } finally {
      setLoading(false)
    }
  }

  const loadFlows = async () => {
    try {
      const response = await flowsClient.listFlows()
      if (response.success && response.data) {
        const allowed = response.data.flows.filter((flow) => !flow.isTemplate && flow.version?.status !== "DELETED")
        setFlows(allowed)
      }
    } catch {
      toast.error("Erro ao carregar flows")
    }
  }

  const loadProjectDetails = async (projectId: number) => {
    setLoadingFlows(true)
    try {
      const [projectRes, flowsRes] = await Promise.all([
        projectsClient.getProject(projectId),
        projectsClient.listProjectFlows(projectId),
      ])

      if (projectRes.success && projectRes.data) {
        setSelectedProject(projectRes.data.project)
        setProjects((prev) => prev.map((p) => (p.id === projectId ? projectRes.data!.project : p)))
      }
      if (flowsRes.success && flowsRes.data) {
        setLinkedFlows(flowsRes.data.flows || [])
      }
    } catch {
      toast.error("Erro ao carregar detalhes do projeto")
    } finally {
      setLoadingFlows(false)
    }
  }

  const openCreateDialog = () => {
    setFormData({ name: "", client: "", description: "" })
    setCreateDialogOpen(true)
  }

  const openEditDialog = (project: Project) => {
    setSelectedProject(project)
    setFormData({
      name: project.name,
      client: project.client,
      description: project.description || "",
    })
    setEditDialogOpen(true)
  }

  const openManageDialog = async (project: Project) => {
    setSelectedProject(project)
    setSelectedFlowId("")
    setManageDialogOpen(true)
    await loadProjectDetails(project.id)
  }

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.client.trim()) {
      toast.error("Nome e cliente sao obrigatorios")
      return
    }

    setSubmitting(true)
    try {
      const response = await projectsClient.createProject({
        name: formData.name.trim(),
        client: formData.client.trim(),
        description: formData.description.trim() || undefined,
      })
      if (response.success && response.data) {
        toast.success("Projeto criado com sucesso")
        setCreateDialogOpen(false)
        await loadProjects(statusFilter)
      } else {
        toast.error(response.error?.message || "Erro ao criar projeto")
      }
    } catch {
      toast.error("Erro ao criar projeto")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedProject || !formData.name.trim() || !formData.client.trim()) {
      toast.error("Nome e cliente sao obrigatorios")
      return
    }

    setSubmitting(true)
    try {
      const response = await projectsClient.updateProject(selectedProject.id, {
        name: formData.name.trim(),
        client: formData.client.trim(),
        description: formData.description.trim() || undefined,
      })
      if (response.success && response.data) {
        toast.success("Projeto atualizado com sucesso")
        setEditDialogOpen(false)
        setProjects((prev) => prev.map((p) => (p.id === selectedProject.id ? response.data!.project : p)))
      } else {
        toast.error(response.error?.message || "Erro ao atualizar projeto")
      }
    } catch {
      toast.error("Erro ao atualizar projeto")
    } finally {
      setSubmitting(false)
    }
  }

  const handleArchive = async () => {
    if (!projectToArchive) return
    setSubmitting(true)
    try {
      const response = await projectsClient.archiveProject(projectToArchive.id)
      if (response.success) {
        toast.success("Projeto arquivado")
        setArchiveDialogOpen(false)
        setProjectToArchive(null)
        await loadProjects(statusFilter)
      } else {
        toast.error(response.error?.message || "Erro ao arquivar projeto")
      }
    } catch {
      toast.error("Erro ao arquivar projeto")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRestore = async () => {
    if (!projectToRestore) return
    setSubmitting(true)
    try {
      const response = await projectsClient.restoreProject(projectToRestore.id)
      if (response.success) {
        toast.success("Projeto restaurado")
        setRestoreDialogOpen(false)
        setProjectToRestore(null)
        await loadProjects(statusFilter)
      } else {
        toast.error(response.error?.message || "Erro ao restaurar projeto")
      }
    } catch {
      toast.error("Erro ao restaurar projeto")
    } finally {
      setSubmitting(false)
    }
  }

  const handleLinkFlow = async () => {
    if (!selectedProject || !selectedFlowId) return
    setSubmitting(true)
    try {
      const response = await projectsClient.linkFlow(selectedProject.id, Number(selectedFlowId))
      if (response.success) {
        toast.success("Flow vinculado com sucesso")
        setSelectedFlowId("")
        await loadProjectDetails(selectedProject.id)
      } else {
        toast.error(response.error?.message || "Erro ao vincular flow")
      }
    } catch {
      toast.error("Erro ao vincular flow")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnlinkFlow = async (flowId: number) => {
    if (!selectedProject) return
    setSubmitting(true)
    try {
      const response = await projectsClient.unlinkFlow(selectedProject.id, flowId)
      if (response.success) {
        toast.success("Flow desvinculado com sucesso")
        await loadProjectDetails(selectedProject.id)
      } else {
        toast.error(response.error?.message || "Erro ao desvincular flow")
      }
    } catch {
      toast.error("Erro ao desvincular flow")
    } finally {
      setSubmitting(false)
    }
  }

  const availableFlows = useMemo(() => {
    const linkedIds = new Set(linkedFlows.map((flow) => flow.id))
    return flows.filter((flow) => !linkedIds.has(flow.id))
  }, [flows, linkedFlows])

  const totals = useMemo(() => {
    const base = {
      totalFlows: 0,
      totalExecutions: 0,
      totalErrors: 0,
      successRateAvg: 0,
      progressoAvg: 0,
    }

    if (projects.length === 0) return base

    const reduced = projects.reduce((acc, project) => {
      const metrics = project.metrics
      if (!metrics) return acc
      acc.totalFlows += metrics.totalFlows
      acc.totalExecutions += metrics.totalExecutions
      acc.totalErrors += metrics.totalErrors
      acc.successRateAvg += metrics.successRate
      acc.progressoAvg += metrics.progressoGeral
      return acc
    }, base)

    return {
      ...reduced,
      successRateAvg: Number((reduced.successRateAvg / projects.length).toFixed(2)),
      progressoAvg: Number((reduced.progressoAvg / projects.length).toFixed(2)),
    }
  }, [projects])

  if (!projectsEnabled) {
    return (
      <div className="p-6">
        <Card className="border-amber-500/50 bg-amber-500/10 max-w-2xl">
          <CardHeader>
            <CardTitle>Projetos indisponivel no plano atual</CardTitle>
            <CardDescription>
              A feature de projetos esta disponivel apenas para planos Team e Enterprise.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground mt-1">Organize flows por cliente/projeto e acompanhe metricas de execucao</p>
        </div>
        <Button size="lg" onClick={openCreateDialog}>
          <Plus className="mr-2 h-5 w-5" />
          Novo Projeto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Projetos</CardDescription>
            <CardTitle>{projects.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Flows nos Projetos</CardDescription>
            <CardTitle>{totals.totalFlows}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa Media de Sucesso</CardDescription>
            <CardTitle>{totals.successRateAvg}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progresso Medio</CardDescription>
            <CardTitle>{totals.progressoAvg}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="ALL">Todos</TabsTrigger>
          <TabsTrigger value="ACTIVE">Ativos</TabsTrigger>
          <TabsTrigger value="ARCHIVED">Arquivados</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <FolderKanban className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhum projeto encontrado</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
              Crie projetos para organizar flows por cliente e acompanhar o desempenho com metricas.
            </p>
            <Button className="mt-6" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeiro projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const metrics = project.metrics
            return (
              <Card key={project.id} className="group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-2 text-lg">{project.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {project.client}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openManageDialog(project)}>
                          <Activity className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(project)}>
                          Editar
                        </DropdownMenuItem>
                        {project.status === "ACTIVE" ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setProjectToArchive(project)
                              setArchiveDialogOpen(true)
                            }}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Arquivar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              setProjectToRestore(project)
                              setRestoreDialogOpen(true)
                            }}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restaurar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
                      {project.status === "ACTIVE" ? "Ativo" : "Arquivado"}
                    </Badge>
                    <Badge variant="outline">{metrics?.totalFlows || project._count?.flows || 0} flows</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description || "Sem descricao"}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Sucesso</span>
                      <span>{metrics?.successRate ?? 0}%</span>
                    </div>
                    <Progress value={metrics?.successRate ?? 0} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progresso</span>
                      <span>{metrics?.progressoGeral ?? 0}%</span>
                    </div>
                    <Progress value={metrics?.progressoGeral ?? 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
            <DialogDescription>Crie um projeto para organizar seus flows.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nome</Label>
              <Input
                id="project-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                maxLength={200}
                placeholder="Ex: Projeto Acme - Checkout"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-client">Cliente</Label>
              <Input
                id="project-client"
                value={formData.client}
                onChange={(e) => setFormData((prev) => ({ ...prev, client: e.target.value }))}
                maxLength={200}
                placeholder="Ex: Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Descricao</Label>
              <Textarea
                id="project-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                maxLength={1000}
                rows={3}
                placeholder="Contexto do projeto, escopo e objetivo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Criando..." : "Criar Projeto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
            <DialogDescription>Atualize os dados do projeto selecionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client">Cliente</Label>
              <Input
                id="edit-client"
                value={formData.client}
                onChange={(e) => setFormData((prev) => ({ ...prev, client: e.target.value }))}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descricao</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                maxLength={1000}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar Alteracoes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="w-[95vw] max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Projeto: {selectedProject?.name}</DialogTitle>
            <DialogDescription>Detalhes do projeto, metricas e vinculacao de flows.</DialogDescription>
          </DialogHeader>

          {loadingFlows || !selectedProject ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Métricas — 6 cards em linha */}
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Card className="bg-muted/30">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground">Flows vinculados</p>
                    <p className="text-2xl font-semibold">{selectedProject.metrics?.totalFlows ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground">Execucoes totais</p>
                    <p className="text-2xl font-semibold">{selectedProject.metrics?.totalExecutions ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground">Erros totais</p>
                    <p className="text-2xl font-semibold">{selectedProject.metrics?.totalErrors ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground">Taxa de sucesso</p>
                    <p className="text-2xl font-semibold text-green-600">{selectedProject.metrics?.successRate ?? 0}%</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground">Taxa de erro</p>
                    <p className="text-2xl font-semibold text-red-500">{selectedProject.metrics?.errorRate ?? 0}%</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground">Progresso geral</p>
                    <p className="text-2xl font-semibold">{selectedProject.metrics?.progressoGeral ?? 0}%</p>
                  </CardContent>
                </Card>
              </div>

              {/* Desempenho + Gráfico lado a lado + Vincular flow */}
              <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Desempenho</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Taxa de sucesso</span>
                        <span>{selectedProject.metrics?.successRate ?? 0}%</span>
                      </div>
                      <Progress value={selectedProject.metrics?.successRate ?? 0} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Taxa de erro</span>
                        <span>{selectedProject.metrics?.errorRate ?? 0}%</span>
                      </div>
                      <Progress value={selectedProject.metrics?.errorRate ?? 0} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progresso geral</span>
                        <span>{selectedProject.metrics?.progressoGeral ?? 0}%</span>
                      </div>
                      <Progress value={selectedProject.metrics?.progressoGeral ?? 0} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Grafico % Sucesso x Erro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Pie
                          data={[
                            { name: "success", value: Number(selectedProject.metrics?.successRate || 0) },
                            { name: "error", value: Number(selectedProject.metrics?.errorRate || 0) },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={80}
                          strokeWidth={4}
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#ef4444" />
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="flex items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                        <span>Sucesso ({selectedProject.metrics?.successRate ?? 0}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        <span>Erro ({selectedProject.metrics?.errorRate ?? 0}%)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Vincular flow</CardTitle>
                    <CardDescription>Associe flows existentes a este projeto.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col gap-2">
                      <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um flow" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFlows.map((flow) => (
                            <SelectItem key={flow.id} value={String(flow.id)}>
                              {flow.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleLinkFlow} disabled={!selectedFlowId || submitting || selectedProject.status !== "ACTIVE"}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Vincular
                      </Button>
                    </div>
                    {selectedProject.status !== "ACTIVE" && (
                      <p className="text-sm text-muted-foreground">Projetos arquivados nao aceitam novos vinculos.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Flows vinculados em grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Flows vinculados ({linkedFlows.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {linkedFlows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum flow vinculado.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {linkedFlows.map((flow) => (
                        <div key={flow.id} className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                          <div className="min-w-0 flex-1 mr-3">
                            <p className="font-medium truncate">{flow.name}</p>
                            <p className="text-xs text-muted-foreground">{getFlowCards(flow).length} cards</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlinkFlow(flow.id)}
                            disabled={submitting}
                          >
                            <Unlink className="mr-2 h-4 w-4" />
                            Desvincular
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar "{projectToArchive?.name}"? Flows continuam existindo, mas o projeto ficara bloqueado para novos vinculos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Arquivando..." : "Arquivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja restaurar "{projectToRestore?.name}" para o status ativo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={submitting}>
              {submitting ? "Restaurando..." : "Restaurar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
