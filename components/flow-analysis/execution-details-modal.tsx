"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    CheckCircle2,
    XCircle,
    Clock,
    Minus,
    Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
    flowAnalysisClient,
    type AnalysisExecutionDetails,
    type AnalysisCardExecutionStatus,
} from "@/lib"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ExecutionDetailsModalProps {
    workspaceId: number
    executionId: number
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ExecutionDetailsModal({
    workspaceId,
    executionId,
    open,
    onOpenChange,
}: ExecutionDetailsModalProps) {
    const [details, setDetails] = useState<AnalysisExecutionDetails | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open && executionId) {
            loadDetails()
        }
    }, [open, executionId])

    const loadDetails = async () => {
        setIsLoading(true)
        try {
            const response = await flowAnalysisClient.getExecutionDetails(workspaceId, executionId)
            if (response.success && response.data) {
                setDetails(response.data.execution)
            } else {
                toast.error(response.error?.message || "Erro ao carregar detalhes")
            }
        } catch (error) {
            toast.error("Erro ao carregar detalhes")
        } finally {
            setIsLoading(false)
        }
    }

    const getCardStatusBadge = (status: AnalysisCardExecutionStatus) => {
        const variants: Record<AnalysisCardExecutionStatus, { variant: any; label: string; icon: any }> = {
            PENDING: { variant: "secondary", label: "Pendente", icon: Minus },
            PASSED: { variant: "default", label: "Passou", icon: CheckCircle2 },
            FAILED: { variant: "destructive", label: "Falhou", icon: XCircle },
            SKIPPED: { variant: "outline", label: "Pulado", icon: Minus },
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

    const parseAttachments = (attachmentsJson: string | null): string[] => {
        if (!attachmentsJson) return []
        try {
            return JSON.parse(attachmentsJson)
        } catch {
            return []
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detalhes da Execução</DialogTitle>
                    <DialogDescription>
                        Visualize os resultados completos da execução do flow
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                ) : details ? (
                    <div className="space-y-6">
                        {/* Execution Summary */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Flow</p>
                                        <p className="font-semibold">{details.flow.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Cliente</p>
                                        <p className="font-semibold">{details.client?.name || "N/A"}</p>
                                        <p className="text-xs text-muted-foreground">{details.clientEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Iniciado</p>
                                        <p className="text-sm">
                                            {formatDistanceToNow(new Date(details.startedAt), {
                                                addSuffix: true,
                                                locale: ptBR,
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <Badge variant={details.status === "COMPLETED" ? "default" : "destructive"}>
                                            {details.status}
                                        </Badge>
                                    </div>
                                    {details.notes && (
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-muted-foreground">Notas da Execução</p>
                                            <p className="text-sm">{details.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card Executions */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Cards Executados ({details.cardExecutions.length})</h3>
                            {details.cardExecutions.map((cardExec) => {
                                const attachments = parseAttachments(cardExec.attachments)

                                return (
                                    <Card key={cardExec.id}>
                                        <CardContent className="pt-6">
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {getCardStatusBadge(cardExec.status)}
                                                            <Badge variant="outline" className="font-mono text-xs">
                                                                {cardExec.card.type}
                                                            </Badge>
                                                        </div>
                                                        <h4 className="font-semibold">{cardExec.card.title || "Sem título"}</h4>
                                                        {cardExec.card.content && (
                                                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                                                {cardExec.card.content}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {cardExec.notes && (
                                                    <div className="bg-muted p-3 rounded-md">
                                                        <p className="text-sm font-medium mb-1">Observações do Cliente:</p>
                                                        <p className="text-sm">{cardExec.notes}</p>
                                                    </div>
                                                )}

                                                {attachments.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                                            <ImageIcon className="h-4 w-4" />
                                                            Evidências ({attachments.length})
                                                        </p>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                            {attachments.map((url, index) => (
                                                                <a
                                                                    key={index}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="block aspect-video rounded-md overflow-hidden border hover:border-primary transition-colors"
                                                                >
                                                                    <img
                                                                        src={url}
                                                                        alt={`Evidência ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <p className="text-xs text-muted-foreground">
                                                    Executado{" "}
                                                    {formatDistanceToNow(new Date(cardExec.executedAt), {
                                                        addSuffix: true,
                                                        locale: ptBR,
                                                    })}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum detalhe encontrado</p>
                )}
            </DialogContent>
        </Dialog>
    )
}
