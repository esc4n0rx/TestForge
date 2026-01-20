"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    CheckCircle2,
    XCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    Upload,
    Image as ImageIcon,
    Loader2,
    AlertCircle,
    TestTube2,
    FileText,
    Paperclip,
    CheckCheck,
} from "lucide-react"
import { flowUseClient } from "@/lib"
import type { FlowUseSessionResponse, CardExecutionStatus } from "@/lib"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface CardExecutionState {
    status: CardExecutionStatus
    notes: string
    attachments: string[]
}

export default function TestExecutionPage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string

    const [sessionData, setSessionData] = useState<FlowUseSessionResponse | null>(null)
    const [executionId, setExecutionId] = useState<number | null>(null)
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [cardStates, setCardStates] = useState<Map<number, CardExecutionState>>(new Map())
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isCompleting, setIsCompleting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [showCompleteDialog, setShowCompleteDialog] = useState(false)
    const [finalNotes, setFinalNotes] = useState("")

    useEffect(() => {
        loadFlow()
    }, [token])

    const loadFlow = async () => {
        setIsLoading(true)
        try {
            const response = await flowUseClient.getFlowByToken(token)

            if (response.success && response.data) {
                setSessionData(response.data)

                // Initialize card states
                const initialStates = new Map<number, CardExecutionState>()
                response.data.flow.version?.cards.forEach((card) => {
                    initialStates.set(card.id, {
                        status: "PENDING",
                        notes: "",
                        attachments: [],
                    })
                })
                setCardStates(initialStates)

                // Auto-start execution
                await startExecution()
            } else {
                toast.error(response.error?.message || "Erro ao carregar flow")
                router.push("/client/flows")
            }
        } catch (error) {
            toast.error("Erro ao conectar com o servidor")
            router.push("/client/flows")
        } finally {
            setIsLoading(false)
        }
    }

    const startExecution = async () => {
        try {
            const response = await flowUseClient.startExecution(token)
            if (response.success && response.data?.execution) {
                setExecutionId(response.data.execution.id)
            }
        } catch (error) {
            console.error("Failed to start execution:", error)
        }
    }

    const handleSaveCard = async () => {
        if (!executionId || !currentCard) return

        const state = cardStates.get(currentCard.id)
        if (!state) return

        setIsSaving(true)
        try {
            const response = await flowUseClient.recordCardExecution(executionId, currentCard.id, {
                status: state.status,
                notes: state.notes || undefined,
                attachments: state.attachments.length > 0 ? JSON.stringify(state.attachments) : undefined,
            })

            if (response.success) {
                toast.success("Card salvo com sucesso")
                // Move to next card if not last
                if (currentCardIndex < cards.length - 1) {
                    setCurrentCardIndex(currentCardIndex + 1)
                }
            } else {
                toast.error(response.error?.message || "Erro ao salvar card")
            }
        } catch (error) {
            toast.error("Erro ao salvar card")
        } finally {
            setIsSaving(false)
        }
    }

    const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !currentCard) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Apenas imagens são permitidas")
            return
        }

        // Validate file size (max 25MB as per API docs)
        if (file.size > 25 * 1024 * 1024) {
            toast.error("Imagem muito grande (máximo 25MB)")
            return
        }

        setIsUploading(true)
        try {
            // Use token-based upload endpoint (no authentication required)
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/flow-use/${token}/upload/${currentCard.id}`,
                {
                    method: 'POST',
                    body: formData,
                }
            )

            const data = await response.json()

            if (data.success && data.data) {
                const state = cardStates.get(currentCard.id)
                if (state) {
                    const newAttachments = [...state.attachments, data.data.attachment.secureUrl]
                    setCardStates(
                        new Map(cardStates.set(currentCard.id, { ...state, attachments: newAttachments }))
                    )
                    toast.success("Evidência anexada")
                }
            } else {
                // Handle specific error codes from API
                const errorCode = data.error?.code
                if (errorCode === 'SESSION_EXPIRED') {
                    toast.error("Sessão expirada")
                } else if (errorCode === 'SESSION_REVOKED') {
                    toast.error("Sessão foi revogada")
                } else if (errorCode === 'LIMIT_REACHED') {
                    toast.error("Limite de evidências atingido")
                } else if (errorCode === 'INVALID_FILE_TYPE') {
                    toast.error("Tipo de arquivo não permitido")
                } else if (errorCode === 'FILE_SIZE_LIMIT_EXCEEDED') {
                    toast.error("Arquivo muito grande (máx 25MB)")
                } else {
                    toast.error(data.error?.message || "Erro ao fazer upload")
                }
            }
        } catch (error) {
            toast.error("Erro ao fazer upload")
        } finally {
            setIsUploading(false)
            e.target.value = "" // Reset input
        }
    }

    const handleCompleteExecution = async () => {
        if (!executionId) return

        setIsCompleting(true)
        try {
            const response = await flowUseClient.completeExecution(executionId, {
                notes: finalNotes || undefined,
            })

            if (response.success) {
                toast.success("Teste completado com sucesso!")
                router.push("/client/flows")
            } else {
                toast.error(response.error?.message || "Erro ao completar teste")
            }
        } catch (error) {
            toast.error("Erro ao completar teste")
        } finally {
            setIsCompleting(false)
            setShowCompleteDialog(false)
        }
    }

    const updateCardState = (cardId: number, updates: Partial<CardExecutionState>) => {
        const state = cardStates.get(cardId)
        if (state) {
            setCardStates(new Map(cardStates.set(cardId, { ...state, ...updates })))
        }
    }

    const getCardTypeIcon = (type: string) => {
        const icons: Record<string, any> = {
            START: CheckCircle2,
            END: CheckCheck,
            ACTION: FileText,
            EVENT: Clock,
            DECISION: AlertCircle,
            ASSERT: CheckCircle2,
            EVIDENCE: Paperclip,
            ERROR: XCircle,
            CONDITION: AlertCircle,
            LOOP: Clock,
            STATE: FileText,
            COMMENT: FileText,
            TECH_NOTE: FileText,
        }
        return icons[type] || FileText
    }

    const getStatusColor = (status: CardExecutionStatus) => {
        const colors: Record<CardExecutionStatus, string> = {
            PENDING: "text-muted-foreground",
            PASSED: "text-green-600 dark:text-green-400",
            FAILED: "text-red-600 dark:text-red-400",
            SKIPPED: "text-amber-600 dark:text-amber-400",
        }
        return colors[status]
    }

    if (isLoading || !sessionData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Carregando flow...</p>
                </div>
            </div>
        )
    }

    const cards = sessionData.flow.version?.cards || []
    const currentCard = cards[currentCardIndex]
    const currentState = cardStates.get(currentCard.id)
    const progress = ((currentCardIndex + 1) / cards.length) * 100
    const completedCards = Array.from(cardStates.values()).filter((s) => s.status !== "PENDING").length

    const CardIcon = getCardTypeIcon(currentCard.type)

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <TestTube2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">{sessionData.flow.name}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {sessionData.session.client.nome} • {sessionData.session.workspace.name}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium">
                                    {completedCards} / {cards.length} cards
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Expira{" "}
                                    {formatDistanceToNow(new Date(sessionData.session.expiresAt), {
                                        addSuffix: true,
                                        locale: ptBR,
                                    })}
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowCompleteDialog(true)}
                                disabled={completedCards === 0}
                                size="lg"
                            >
                                <CheckCheck className="mr-2 h-4 w-4" />
                                Completar Teste
                            </Button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <Progress value={progress} className="h-2" />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Sidebar - Card List */}
                    <div className="col-span-3 space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground mb-4">CARDS</h3>
                        <div className="space-y-1">
                            {cards.map((card, index) => {
                                const state = cardStates.get(card.id)
                                const Icon = getCardTypeIcon(card.type)
                                const isActive = index === currentCardIndex

                                return (
                                    <button
                                        key={card.id}
                                        onClick={() => setCurrentCardIndex(index)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4 shrink-0" />
                                            <span className="text-sm font-medium truncate flex-1">
                                                {card.title || `Card ${index + 1}`}
                                            </span>
                                            {state && state.status !== "PENDING" && (
                                                <div className={getStatusColor(state.status)}>
                                                    {state.status === "PASSED" && <CheckCircle2 className="h-4 w-4" />}
                                                    {state.status === "FAILED" && <XCircle className="h-4 w-4" />}
                                                    {state.status === "SKIPPED" && <Clock className="h-4 w-4" />}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Center - Card Details */}
                    <div className="col-span-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <CardIcon className="h-5 w-5 text-primary" />
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {currentCard.type}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-2xl">{currentCard.title || "Sem título"}</CardTitle>
                                        <CardDescription>Card {currentCardIndex + 1} de {cards.length}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Content */}
                                {currentCard.content && (
                                    <div>
                                        <Label className="text-base font-semibold">Instruções</Label>
                                        <div className="mt-2 p-4 rounded-lg bg-muted">
                                            <p className="text-sm whitespace-pre-wrap">{currentCard.content}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Notes from flow */}
                                {currentCard.notes && (
                                    <div>
                                        <Label className="text-base font-semibold">Notas Técnicas</Label>
                                        <div className="mt-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                            <p className="text-sm whitespace-pre-wrap text-amber-900 dark:text-amber-100">
                                                {currentCard.notes}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Flow Attachments */}
                                {currentCard.attachments.length > 0 && (
                                    <div>
                                        <Label className="text-base font-semibold">Anexos de Referência</Label>
                                        <div className="mt-2 grid grid-cols-2 gap-4">
                                            {currentCard.attachments.map((attachment) => (
                                                <a
                                                    key={attachment.id}
                                                    href={attachment.secureUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative aspect-video rounded-lg overflow-hidden border hover:border-primary transition-colors"
                                                >
                                                    <img
                                                        src={attachment.secureUrl}
                                                        alt={attachment.originalName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ImageIcon className="h-8 w-8 text-white" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Status Selection */}
                                <div>
                                    <Label htmlFor="status" className="text-base font-semibold">
                                        Status da Execução *
                                    </Label>
                                    <Select
                                        value={currentState?.status}
                                        onValueChange={(value) =>
                                            updateCardState(currentCard.id, { status: value as CardExecutionStatus })
                                        }
                                    >
                                        <SelectTrigger id="status" className="mt-2">
                                            <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    Pendente
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="PASSED">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    Passou
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="FAILED">
                                                <div className="flex items-center gap-2">
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                    Falhou
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="SKIPPED">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-amber-600" />
                                                    Pulado
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Client Notes */}
                                <div>
                                    <Label htmlFor="notes" className="text-base font-semibold">
                                        Suas Observações
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Adicione observações sobre a execução deste card..."
                                        value={currentState?.notes || ""}
                                        onChange={(e) => updateCardState(currentCard.id, { notes: e.target.value })}
                                        rows={4}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Evidence Upload */}
                                <div>
                                    <Label className="text-base font-semibold">Evidências</Label>
                                    <div className="mt-2 space-y-4">
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                            <input
                                                type="file"
                                                id="evidence-upload"
                                                accept="image/*"
                                                onChange={handleUploadEvidence}
                                                className="hidden"
                                                disabled={isUploading}
                                            />
                                            <label htmlFor="evidence-upload" className="cursor-pointer">
                                                <div className="flex flex-col items-center gap-2">
                                                    {isUploading ? (
                                                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                                                    ) : (
                                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                                    )}
                                                    <p className="text-sm font-medium">
                                                        {isUploading ? "Fazendo upload..." : "Clique para anexar evidência"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">PNG, JPG até 5MB</p>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Uploaded Evidence */}
                                        {currentState && currentState.attachments.length > 0 && (
                                            <div className="grid grid-cols-2 gap-4">
                                                {currentState.attachments.map((url, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative aspect-video rounded-lg overflow-hidden border"
                                                    >
                                                        <img src={url} alt={`Evidência ${index + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
                                        disabled={currentCardIndex === 0}
                                    >
                                        <ChevronLeft className="mr-2 h-4 w-4" />
                                        Anterior
                                    </Button>

                                    <Button onClick={handleSaveCard} disabled={isSaving || currentState?.status === "PENDING"} size="lg">
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                Salvar {currentCardIndex < cards.length - 1 && "& Próximo"}
                                                {currentCardIndex < cards.length - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Sidebar - Summary */}
                    <div className="col-span-3 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Resumo da Execução</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Progresso</span>
                                        <span className="font-semibold">{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} className="mt-2" />
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Total de Cards</span>
                                        <span className="font-medium">{cards.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-green-600 dark:text-green-400">Passou</span>
                                        <span className="font-medium">
                                            {Array.from(cardStates.values()).filter((s) => s.status === "PASSED").length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-red-600 dark:text-red-400">Falhou</span>
                                        <span className="font-medium">
                                            {Array.from(cardStates.values()).filter((s) => s.status === "FAILED").length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-amber-600 dark:text-amber-400">Pulado</span>
                                        <span className="font-medium">
                                            {Array.from(cardStates.values()).filter((s) => s.status === "SKIPPED").length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Pendente</span>
                                        <span className="font-medium">
                                            {Array.from(cardStates.values()).filter((s) => s.status === "PENDING").length}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Alert>
                            <Clock className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                                Sessão expira{" "}
                                {formatDistanceToNow(new Date(sessionData.session.expiresAt), {
                                    addSuffix: true,
                                    locale: ptBR,
                                })}
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            </div>

            {/* Complete Dialog */}
            <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Completar Teste</DialogTitle>
                        <DialogDescription>
                            Você está prestes a finalizar a execução deste flow. Adicione observações finais se desejar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="final-notes">Observações Finais (Opcional)</Label>
                            <Textarea
                                id="final-notes"
                                placeholder="Adicione comentários gerais sobre a execução..."
                                value={finalNotes}
                                onChange={(e) => setFinalNotes(e.target.value)}
                                rows={4}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCompleteDialog(false)} disabled={isCompleting}>
                                Cancelar
                            </Button>
                            <Button onClick={handleCompleteExecution} disabled={isCompleting}>
                                {isCompleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Completando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCheck className="mr-2 h-4 w-4" />
                                        Completar Teste
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
