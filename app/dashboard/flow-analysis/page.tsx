"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    BarChart3,
    CheckCircle2,
    XCircle,
    Clock,
    Users,
    TrendingUp,
    FileText,
    Loader2,
    Eye,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import {
    flowAnalysisClient,
    flowsClient,
    type AnalysisExecutionSummary,
    type WorkspaceStatistics,
    type FlowWithDetails,
    type AnalysisExecutionStatus,
} from "@/lib"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ExecutionDetailsModal } from "@/components/flow-analysis/execution-details-modal"

export default function FlowAnalysisPage() {
    const { workspace } = useAuth()
    const [statistics, setStatistics] = useState<WorkspaceStatistics | null>(null)
    const [executions, setExecutions] = useState<AnalysisExecutionSummary[]>([])
    const [flows, setFlows] = useState<FlowWithDetails[]>([])
    const [isLoadingStats, setIsLoadingStats] = useState(true)
    const [isLoadingExecutions, setIsLoadingExecutions] = useState(true)
    const [total, setTotal] = useState(0)

    // Filters
    const [selectedFlowId, setSelectedFlowId] = useState<string>("all")
    const [selectedStatus, setSelectedStatus] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    // Modal
    const [selectedExecutionId, setSelectedExecutionId] = useState<number | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)

    useEffect(() => {
        if (workspace) {
            loadStatistics()
            loadFlows()
        }
    }, [workspace])

    useEffect(() => {
        if (workspace) {
            loadExecutions()
        }
    }, [workspace, selectedFlowId, selectedStatus, currentPage])

    const loadStatistics = async () => {
        if (!workspace) return

        setIsLoadingStats(true)
        try {
            const response = await flowAnalysisClient.getWorkspaceStatistics(workspace.id)
            if (response.success && response.data) {
                setStatistics(response.data.statistics)
            } else {
                toast.error(response.error?.message || "Erro ao carregar estatísticas")
            }
        } catch (error) {
            toast.error("Erro ao carregar estatísticas")
        } finally {
            setIsLoadingStats(false)
        }
    }

    const loadFlows = async () => {
        if (!workspace) return

        try {
            const response = await flowsClient.listFlows()
            if (response.success && response.data) {
                setFlows(response.data.flows)
            }
        } catch (error) {
            console.error("Error loading flows:", error)
        }
    }

    const loadExecutions = async () => {
        if (!workspace) return

        setIsLoadingExecutions(true)
        try {
            const filters: any = {
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage,
            }

            if (selectedFlowId !== "all") {
                filters.flowId = Number(selectedFlowId)
            }

            if (selectedStatus !== "all") {
                filters.status = selectedStatus as AnalysisExecutionStatus
            }

            const response = await flowAnalysisClient.listWorkspaceExecutions(workspace.id, filters)
            if (response.success && response.data) {
                setExecutions(response.data.executions)
                setTotal(response.data.total)
            } else {
                toast.error(response.error?.message || "Erro ao carregar execuções")
            }
        } catch (error) {
            toast.error("Erro ao carregar execuções")
        } finally {
            setIsLoadingExecutions(false)
        }
    }

    const getStatusBadge = (status: AnalysisExecutionStatus) => {
        const variants: Record<AnalysisExecutionStatus, { variant: any; label: string; icon: any }> = {
            IN_PROGRESS: { variant: "default", label: "Em Progresso", icon: Clock },
            COMPLETED: { variant: "secondary", label: "Concluído", icon: CheckCircle2 },
            FAILED: { variant: "destructive", label: "Falhou", icon: XCircle },
        }

        const config = variants[status]
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        )
    }

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "-"
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}m ${remainingSeconds}s`
    }

    const totalPages = Math.ceil(total / itemsPerPage)

    if (!workspace) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p>Carregando workspace...</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-8 w-8" />
                        Análise de Execuções
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Visualize e analise os resultados das execuções de flows
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            {isLoadingStats ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : statistics ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Total de Execuções
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.totalExecutions}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Taxa de Sucesso
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.successRate}%</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Concluídas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.completedExecutions}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Clientes Ativos
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.totalClients}</div>
                        </CardContent>
                    </Card>
                </div>
            ) : null}

            {/* Filters and Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Execuções Recentes</CardTitle>
                        <div className="flex items-center gap-2">
                            <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Todos os flows" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os flows</SelectItem>
                                    {flows.map((flow) => (
                                        <SelectItem key={flow.id} value={flow.id.toString()}>
                                            {flow.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Todos os status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os status</SelectItem>
                                    <SelectItem value="COMPLETED">Concluído</SelectItem>
                                    <SelectItem value="FAILED">Falhou</SelectItem>
                                    <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingExecutions ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : executions.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Nenhuma execução encontrada</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Flow</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Iniciado</TableHead>
                                        <TableHead>Duração</TableHead>
                                        <TableHead>Cards</TableHead>
                                        <TableHead>Evidências</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {executions.map((execution) => (
                                        <TableRow key={execution.id}>
                                            <TableCell className="font-medium">{execution.flowName}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{execution.client?.name || "N/A"}</p>
                                                    <p className="text-xs text-muted-foreground">{execution.clientEmail}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(execution.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(execution.startedAt), {
                                                    addSuffix: true,
                                                    locale: ptBR,
                                                })}
                                            </TableCell>
                                            <TableCell className="text-sm">{formatDuration(execution.duration)}</TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <span className="text-green-600 font-medium">{execution.passedCards}</span>
                                                    {execution.failedCards > 0 && (
                                                        <span className="text-red-600 font-medium"> / {execution.failedCards}</span>
                                                    )}
                                                    <span className="text-muted-foreground"> / {execution.totalCards}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{execution.evidencesCount}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedExecutionId(execution.id)
                                                        setShowDetailsModal(true)
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Ver Detalhes
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                                        {Math.min(currentPage * itemsPerPage, total)} de {total} execuções
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm">
                                            Página {currentPage} de {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Execution Details Modal */}
            {selectedExecutionId && (
                <ExecutionDetailsModal
                    workspaceId={workspace.id}
                    executionId={selectedExecutionId}
                    open={showDetailsModal}
                    onOpenChange={setShowDetailsModal}
                />
            )}
        </div>
    )
}
