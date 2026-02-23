"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    TestTube2,
    Play,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    LogOut,
    User,
    Building2,
    Download,
    PenLine,
} from "lucide-react"
import { clientAuthClient, flowUseClient } from "@/lib"
import type {
    ClientFlowDisplayStatus,
    ClientFlowProgressItem,
    ClientFlowProgressSummary,
    ClientSession,
    ClientExecution,
} from "@/lib"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function ClientFlowsPage() {
    const router = useRouter()
    const [client, setClient] = useState<any>(null)
    const [flowsProgress, setFlowsProgress] = useState<ClientFlowProgressItem[]>([])
    const [flowProgressSummary, setFlowProgressSummary] = useState<ClientFlowProgressSummary | null>(null)
    const [sessions, setSessions] = useState<ClientSession[]>([])
    const [executions, setExecutions] = useState<ClientExecution[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showSignDialog, setShowSignDialog] = useState(false)
    const [selectedExecutionId, setSelectedExecutionId] = useState<number | null>(null)
    const [signerName, setSignerName] = useState("")
    const [signatureData, setSignatureData] = useState("")
    const [isSigning, setIsSigning] = useState(false)
    const [exportingExecutionId, setExportingExecutionId] = useState<number | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        try {
            // Load client data
            const clientResponse = await clientAuthClient.getCurrentClient()
            if (clientResponse.success && clientResponse.data) {
                setClient(clientResponse.data)
            } else {
                router.push("/client/login")
                return
            }

            // Load consolidated flow progress/status for UI
            const flowsProgressResponse = await clientAuthClient.getFlowsProgress()
            if (flowsProgressResponse.success && flowsProgressResponse.data) {
                setFlowsProgress(flowsProgressResponse.data.flows)
                setFlowProgressSummary(flowsProgressResponse.data.summary)
            }

            // Load sessions
            const sessionsResponse = await clientAuthClient.getSessions()
            if (sessionsResponse.success && sessionsResponse.data) {
                setSessions(sessionsResponse.data.sessions)
            }

            // Load executions
            const executionsResponse = await clientAuthClient.getExecutions()
            if (executionsResponse.success && executionsResponse.data) {
                setExecutions(executionsResponse.data.executions)
            }
        } catch (error) {
            toast.error("Erro ao carregar dados")
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            await clientAuthClient.logout()
            router.push("/client/login")
        } catch (error) {
            toast.error("Erro ao fazer logout")
        }
    }

    const handleStartTest = (session: ClientSession) => {
        router.push(`/client/test/${session.token}`)
    }

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = filename
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        window.URL.revokeObjectURL(url)
    }

    const handleOpenSignDialog = (executionId: number) => {
        setSelectedExecutionId(executionId)
        setSignerName("")
        setSignatureData("")
        setShowSignDialog(true)
    }

    const handleSignExecution = async () => {
        if (!selectedExecutionId) return

        const trimmedName = signerName.trim()
        if (trimmedName.length < 2) {
            toast.error("Informe o nome completo do assinante")
            return
        }

        setIsSigning(true)
        try {
            const response = await flowUseClient.signExecution(selectedExecutionId, {
                signerName: trimmedName,
                signatureData: signatureData.trim() || undefined,
            })

            if (response.success) {
                toast.success(response.data?.message || "Execucao assinada com sucesso")
                setShowSignDialog(false)
                setSelectedExecutionId(null)
            } else {
                toast.error(response.error?.message || "Erro ao assinar execucao")
            }
        } catch {
            toast.error("Erro ao assinar execucao")
        } finally {
            setIsSigning(false)
        }
    }

    const handleExportExecutionPdf = async (executionId: number) => {
        setExportingExecutionId(executionId)
        try {
            const response = await flowUseClient.exportExecutionPdf(executionId)
            if (response.success) {
                downloadBlob(response.data.blob, response.data.filename)
                toast.success("PDF exportado com sucesso")
            } else {
                toast.error(response.error.message || "Erro ao exportar PDF")
            }
        } finally {
            setExportingExecutionId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string; icon: any }> = {
            NOT_STARTED: { variant: "outline", label: "Nao Iniciado", icon: Play },
            ACTIVE: { variant: "default", label: "Ativo", icon: Clock },
            COMPLETED: { variant: "secondary", label: "Completo", icon: CheckCircle2 },
            EXPIRED: { variant: "secondary", label: "Expirado", icon: XCircle },
            REVOKED: { variant: "destructive", label: "Revogado", icon: XCircle },
            IN_PROGRESS: { variant: "default", label: "Em Progresso", icon: Loader2 },
            FAILED: { variant: "destructive", label: "Falhou", icon: XCircle },
        }

        const config = variants[status] || variants.ACTIVE
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        )
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

    const getSessionProgress = (session: ClientSession): ClientFlowProgressItem | undefined => {
        return flowsProgress.find((item) => item.session.id === session.id) ??
            flowsProgress.find((item) => item.flow.id === session.flowId)
    }

    const getProgressIndicatorClass = (status?: ClientFlowDisplayStatus) => {
        if (status === "FAILED") return "bg-destructive"
        if (status === "COMPLETED") return "bg-emerald-500"
        return undefined
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="border-b">
                    <div className="container mx-auto px-4 py-4">
                        <Skeleton className="h-8 w-48" />
                    </div>
                </div>
                <div className="container mx-auto px-4 py-8 space-y-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <TestTube2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Portal do Cliente</h1>
                                <p className="text-sm text-muted-foreground">{client?.workspace?.name}</p>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <User className="h-4 w-4" />
                                    {client?.nome}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="px-2 py-1.5">
                                    <p className="text-sm font-medium">{client?.nome}</p>
                                    <p className="text-xs text-muted-foreground">{client?.email}</p>
                                    {client?.company && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            <Building2 className="h-3 w-3" />
                                            {client.company}
                                        </p>
                                    )}
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 space-y-8">
                {flowProgressSummary && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total de Flows</CardDescription>
                                <CardTitle className="text-2xl">{flowProgressSummary.totalFlows}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Em Progresso</CardDescription>
                                <CardTitle className="text-2xl">{flowProgressSummary.inProgress}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Concluidos</CardDescription>
                                <CardTitle className="text-2xl">{flowProgressSummary.completed}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Nao Iniciados</CardDescription>
                                <CardTitle className="text-2xl">{flowProgressSummary.notStarted}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>
                )}

                {/* Active Sessions */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold">Sessões Ativas</h2>
                        <p className="text-muted-foreground">Flows disponíveis para execução</p>
                    </div>

                    {sessions.filter((s) => s.status === "ACTIVE").length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <TestTube2 className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">Nenhuma sessão ativa</h3>
                                <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                                    Aguarde até que a empresa compartilhe um flow de teste com você
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {sessions
                                .filter((s) => s.status === "ACTIVE")
                                .map((session) => {
                                    const flowProgress = getSessionProgress(session)
                                    const percent = flowProgress?.progress.percent ?? 0
                                    const displayStatus = flowProgress?.displayStatus ?? (session.status as ClientFlowDisplayStatus)
                                    const expiresIn = new Date(session.expiresAt).getTime() - Date.now()
                                    const isExpiringSoon = expiresIn < 24 * 60 * 60 * 1000 // < 24h

                                    return (
                                        <Card key={session.id} className="group hover:shadow-lg transition-shadow">
                                            <CardHeader>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-1 flex-1">
                                                        <CardTitle className="line-clamp-2">{session.flow.name}</CardTitle>
                                                        <CardDescription className="flex items-center gap-2 flex-wrap">
                                                            <Badge variant="secondary" className="font-mono text-xs">
                                                                {getFlowTypeLabel(session.flow.type)}
                                                            </Badge>
                                                            {flowProgress?.flow.environment && (
                                                                <Badge variant="outline" className="font-mono text-xs">
                                                                    {getEnvironmentLabel(flowProgress.flow.environment)}
                                                                </Badge>
                                                            )}
                                                            {getStatusBadge(displayStatus)}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Progresso</span>
                                                        <span className="font-medium">{percent}%</span>
                                                    </div>
                                                    <Progress
                                                        value={percent}
                                                        className="h-2"
                                                        indicatorClassName={getProgressIndicatorClass(displayStatus)}
                                                    />
                                                    {flowProgress && (
                                                        <div className="flex items-center justify-between text-xs text-muted-foreground gap-2">
                                                            <span>
                                                                {flowProgress.progress.completedCards}/{flowProgress.progress.totalCards} cards
                                                            </span>
                                                            <span>
                                                                OK {flowProgress.progress.passedCards} · Falhas {flowProgress.progress.failedCards}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    <span>
                                                        Expira{" "}
                                                        {formatDistanceToNow(new Date(session.expiresAt), {
                                                            addSuffix: true,
                                                            locale: ptBR,
                                                        })}
                                                    </span>
                                                </div>

                                                {isExpiringSoon && (
                                                    <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Sessão expirando em breve
                                                    </div>
                                                )}

                                                <Button onClick={() => handleStartTest(session)} className="w-full" size="lg">
                                                    <Play className="mr-2 h-4 w-4" />
                                                    {percent > 0 ? "Continuar Teste" : "Iniciar Teste"}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                        </div>
                    )}
                </div>

                {/* Execution History */}
                {executions.length > 0 && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-2xl font-bold">Histórico de Execuções</h2>
                            <p className="text-muted-foreground">Seus testes anteriores</p>
                        </div>

                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Flow</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Iniciado</TableHead>
                                        <TableHead>Completado</TableHead>
                                        <TableHead className="text-right">Acoes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {executions.slice(0, 10).map((execution) => (
                                        <TableRow key={execution.id}>
                                            <TableCell className="font-medium">{execution.flow.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {getFlowTypeLabel(execution.flow.type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(execution.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(execution.startedAt), {
                                                    addSuffix: true,
                                                    locale: ptBR,
                                                })}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {execution.completedAt
                                                    ? formatDistanceToNow(new Date(execution.completedAt), {
                                                        addSuffix: true,
                                                        locale: ptBR,
                                                    })
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {execution.status === "COMPLETED" ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenSignDialog(execution.id)}
                                                        >
                                                            <PenLine className="mr-1 h-3.5 w-3.5" />
                                                            Assinar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleExportExecutionPdf(execution.id)}
                                                            disabled={exportingExecutionId === execution.id}
                                                        >
                                                            {exportingExecutionId === execution.id ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Download className="mr-1 h-3.5 w-3.5" />
                                                                    Exportar PDF
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                )}
            </div>

            <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assinar Execucao</DialogTitle>
                        <DialogDescription>
                            Confirme seu nome para assinar a execucao selecionada.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="history-signer-name">Nome do Assinante *</Label>
                            <Input
                                id="history-signer-name"
                                placeholder="Nome completo"
                                value={signerName}
                                onChange={(e) => setSignerName(e.target.value)}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="history-signature-data">Assinatura Digital (Opcional)</Label>
                            <Textarea
                                id="history-signature-data"
                                placeholder="Texto livre ou assinatura em base64"
                                value={signatureData}
                                onChange={(e) => setSignatureData(e.target.value)}
                                rows={3}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowSignDialog(false)} disabled={isSigning}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSignExecution} disabled={isSigning}>
                                {isSigning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Assinando...
                                    </>
                                ) : (
                                    <>
                                        <PenLine className="mr-2 h-4 w-4" />
                                        Assinar
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
