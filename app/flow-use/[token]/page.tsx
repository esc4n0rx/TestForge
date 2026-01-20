"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Loader2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { flowUseClient, flowUseUploadClient } from "@/lib"
import type { FlowUseSessionResponse } from "@/lib/types/client-portal"
import type { CardExecutionStatus } from "@/lib/types/flow"
import { isSessionActive, canCompleteExecution } from "@/lib/utils/flow-execution-utils"

// Components
import { FlowSessionHeader } from "@/components/flow-use/flow-session-header"
import { FlowProgressTracker } from "@/components/flow-use/flow-progress-tracker"
import { FlowCardsSidebar } from "@/components/flow-use/flow-cards-sidebar"
import { FlowCardDisplay } from "@/components/flow-use/flow-card-display"
import { FlowEvidencePanel } from "@/components/flow-use/flow-evidence-panel"
import { FlowExecutionControls } from "@/components/flow-use/flow-execution-controls"
import {
    SessionNotFound,
    SessionExpired,
    SessionRevoked,
    FlowNotActive,
    NetworkError,
    GenericError
} from "@/components/flow-use/flow-error-states"

interface Evidence {
    url: string
    name: string
}

interface CardData {
    evidences: Evidence[]
    notes: string
}

export default function FlowUsePage() {
    const params = useParams()
    const token = params?.token as string
    const { toast } = useToast()

    // State
    const [flowData, setFlowData] = useState<FlowUseSessionResponse | null>(null)
    const [executionId, setExecutionId] = useState<number | null>(null)
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [cardStatuses, setCardStatuses] = useState<Record<number, CardExecutionStatus>>({})
    const [cardData, setCardData] = useState<Record<number, CardData>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [isExecuting, setIsExecuting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasStarted, setHasStarted] = useState(false)

    // Load flow data
    const loadFlowData = useCallback(async () => {
        if (!token) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await flowUseClient.getFlowByToken(token)

            if (!response.success || !response.data) {
                setError(response.error?.code || 'UNKNOWN_ERROR')
                return
            }

            setFlowData(response.data)

            // Check if session is active
            if (!isSessionActive(response.data.session)) {
                if (response.data.session.status === 'EXPIRED') {
                    setError('SESSION_EXPIRED')
                } else if (response.data.session.status === 'REVOKED') {
                    setError('SESSION_REVOKED')
                } else if (response.data.session.status === 'COMPLETED') {
                    setError('SESSION_COMPLETED')
                }
            }
        } catch (err) {
            setError('NETWORK_ERROR')
        } finally {
            setIsLoading(false)
        }
    }, [token])

    useEffect(() => {
        loadFlowData()
    }, [loadFlowData])

    // Start execution
    const handleStartExecution = async () => {
        if (!flowData || !token) return

        setIsExecuting(true)

        try {
            const response = await flowUseClient.startExecution(token, {})

            if (!response.success || !response.data) {
                toast({
                    title: "Erro ao iniciar execução",
                    description: response.error?.message || "Tente novamente",
                    variant: "destructive"
                })
                return
            }

            if (response.data.execution) {
                setExecutionId(response.data.execution.id)
            }
            setHasStarted(true)

            toast({
                title: "Execução iniciada",
                description: "Você pode começar a executar os cards do flow"
            })
        } catch (err) {
            toast({
                title: "Erro ao iniciar execução",
                description: "Ocorreu um erro inesperado",
                variant: "destructive"
            })
        } finally {
            setIsExecuting(false)
        }
    }

    // Record card status
    const handleCardStatusChange = async (status: CardExecutionStatus) => {
        if (!flowData || !executionId) return

        const currentCard = flowData.flow.version?.cards?.[currentCardIndex]
        if (!currentCard) return

        setIsExecuting(true)

        try {
            const cardInfo = cardData[currentCard.id] || { evidences: [], notes: '' }

            const response = await flowUseClient.recordCardExecution(
                executionId,
                currentCard.id,
                {
                    status,
                    notes: cardInfo.notes || undefined,
                    attachments: cardInfo.evidences.length > 0
                        ? JSON.stringify(cardInfo.evidences.map(e => e.url))
                        : undefined
                }
            )

            if (!response.success) {
                toast({
                    title: "Erro ao registrar execução",
                    description: response.error?.message || "Tente novamente",
                    variant: "destructive"
                })
                return
            }

            // Update status
            setCardStatuses(prev => ({
                ...prev,
                [currentCard.id]: status
            }))

            toast({
                title: "Card registrado",
                description: `Status: ${status === 'PASSED' ? 'Aprovado' : status === 'FAILED' ? 'Falhou' : 'Pulado'}`
            })

            // Auto-navigate to next card if not last
            if (currentCardIndex < (flowData.flow.version?.cards?.length || 0) - 1) {
                setTimeout(() => {
                    setCurrentCardIndex(prev => prev + 1)
                }, 500)
            }
        } catch (err) {
            toast({
                title: "Erro ao registrar execução",
                description: "Ocorreu um erro inesperado",
                variant: "destructive"
            })
        } finally {
            setIsExecuting(false)
        }
    }

    // Complete execution
    const handleCompleteExecution = async () => {
        if (!executionId) return

        setIsExecuting(true)

        try {
            const response = await flowUseClient.completeExecution(executionId, {
                notes: 'Execução finalizada via portal'
            })

            if (!response.success) {
                toast({
                    title: "Erro ao finalizar execução",
                    description: response.error?.message || "Tente novamente",
                    variant: "destructive"
                })
                return
            }

            toast({
                title: "Execução concluída!",
                description: "Todos os cards foram executados com sucesso"
            })

            // Could redirect or show summary here
        } catch (err) {
            toast({
                title: "Erro ao finalizar execução",
                description: "Ocorreu um erro inesperado",
                variant: "destructive"
            })
        } finally {
            setIsExecuting(false)
        }
    }

    // Handle evidence upload
    const handleEvidenceUpload = async (file: File): Promise<string | null> => {
        if (!flowData || !token) return null

        const currentCard = flowData.flow.version?.cards?.[currentCardIndex]
        if (!currentCard) return null

        setIsUploading(true)

        try {
            const response = await flowUseUploadClient.uploadEvidence(
                token,
                currentCard.id,
                file
            )

            if (!response.success || !response.data) {
                toast({
                    title: "Erro ao enviar evidência",
                    description: response.error?.message || "Tente novamente",
                    variant: "destructive"
                })
                return null
            }

            return response.data.attachment.secureUrl
        } catch (err) {
            toast({
                title: "Erro ao enviar evidência",
                description: "Ocorreu um erro inesperado",
                variant: "destructive"
            })
            return null
        } finally {
            setIsUploading(false)
        }
    }

    // Update card data
    const updateCardEvidences = (evidences: Evidence[]) => {
        if (!flowData) return
        const currentCard = flowData.flow.version?.cards?.[currentCardIndex]
        if (!currentCard) return

        setCardData(prev => ({
            ...prev,
            [currentCard.id]: {
                ...prev[currentCard.id],
                evidences
            }
        }))
    }

    const updateCardNotes = (notes: string) => {
        if (!flowData) return
        const currentCard = flowData.flow.version?.cards?.[currentCardIndex]
        if (!currentCard) return

        setCardData(prev => ({
            ...prev,
            [currentCard.id]: {
                ...prev[currentCard.id],
                notes
            }
        }))
    }

    // Error handling
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Carregando flow...</p>
                </div>
            </div>
        )
    }

    if (error === 'SESSION_NOT_FOUND') {
        return <SessionNotFound onRetry={loadFlowData} />
    }

    if (error === 'SESSION_EXPIRED' || error === 'SESSION_COMPLETED') {
        return <SessionExpired onRetry={loadFlowData} />
    }

    if (error === 'SESSION_REVOKED') {
        return <SessionRevoked onRetry={loadFlowData} />
    }

    if (error === 'FLOW_NOT_ACTIVE') {
        return <FlowNotActive onRetry={loadFlowData} />
    }

    if (error === 'NETWORK_ERROR') {
        return <NetworkError onRetry={loadFlowData} />
    }

    if (error) {
        return <GenericError onRetry={loadFlowData} />
    }

    if (!flowData) {
        return <GenericError onRetry={loadFlowData} />
    }

    const currentCard = flowData.flow.version?.cards?.[currentCardIndex]
    const currentCardData = currentCard ? cardData[currentCard.id] || { evidences: [], notes: '' } : { evidences: [], notes: '' }
    const currentCardStatus = currentCard ? cardStatuses[currentCard.id] : undefined

    // Check if we have cards to display
    if (!flowData.flow.version?.cards || flowData.flow.version.cards.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <CardTitle>Flow sem cards</CardTitle>
                        <CardDescription>
                            Este flow não possui cards para executar
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // Check if currentCard exists
    if (!currentCard) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <CardTitle>Card não encontrado</CardTitle>
                        <CardDescription>
                            O card atual não foi encontrado
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setCurrentCardIndex(0)} className="w-full">
                            Voltar ao início
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Start screen
    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-background">
                <FlowSessionHeader
                    flowName={flowData.flow.name}
                    flowDescription={null}
                    workspaceName={flowData.session.workspace.name}
                    sessionStatus={flowData.session.status}
                    expiresAt={flowData.session.expiresAt}
                    clientName={flowData.session.client.nome}
                />

                <div className="mx-auto max-w-2xl px-6 py-12">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Play className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl">Pronto para começar?</CardTitle>
                            <CardDescription>
                                Este flow possui {flowData.flow.version?.cards?.length || 0} cards para executar
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border border-border p-4 space-y-2">
                                <h3 className="font-semibold text-sm">Instruções:</h3>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>Execute cada card seguindo as instruções</li>
                                    <li>Marque o status de cada card (Aprovado, Falhou ou Pulado)</li>
                                    <li>Anexe evidências quando necessário</li>
                                    <li>Adicione observações relevantes</li>
                                    <li>Finalize a execução ao completar todos os cards</li>
                                </ul>
                            </div>
                            <Button
                                onClick={handleStartExecution}
                                disabled={isExecuting}
                                className="w-full"
                                size="lg"
                            >
                                {isExecuting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Iniciando...
                                    </>
                                ) : (
                                    <>
                                        <Play className="mr-2 h-5 w-5" />
                                        Iniciar Execução
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Main execution screen
    return (
        <div className="min-h-screen bg-background">
            <FlowSessionHeader
                flowName={flowData.flow.name}
                flowDescription={null}
                workspaceName={flowData.session.workspace.name}
                sessionStatus={flowData.session.status}
                expiresAt={flowData.session.expiresAt}
                clientName={flowData.session.client.nome}
            />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
                {/* Progress */}
                <div className="mb-6">
                    <FlowProgressTracker
                        totalCards={flowData.flow.version?.cards?.length || 0}
                        cardStatuses={cardStatuses}
                    />
                </div>

                {/* Main Content */}
                <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px]">
                    {/* Cards Sidebar */}
                    <div className="hidden lg:block">
                        <FlowCardsSidebar
                            cards={flowData.flow.version?.cards || []}
                            currentCardIndex={currentCardIndex}
                            cardStatuses={cardStatuses}
                            onCardSelect={setCurrentCardIndex}
                        />
                    </div>

                    {/* Current Card */}
                    <div className="space-y-6">
                        <FlowCardDisplay
                            cardNumber={currentCardIndex + 1}
                            totalCards={flowData.flow.version?.cards?.length || 0}
                            type={currentCard.type as any}
                            title={currentCard.title}
                            content={currentCard.content}
                            notes={currentCard.notes}
                            attachments={currentCard.attachments || []}
                        />

                        <Card>
                            <CardContent className="pt-6">
                                <FlowExecutionControls
                                    currentCardIndex={currentCardIndex}
                                    totalCards={flowData.flow.version?.cards?.length || 0}
                                    currentCardStatus={currentCardStatus}
                                    canNavigatePrevious={currentCardIndex > 0}
                                    canNavigateNext={currentCardIndex < (flowData.flow.version?.cards?.length || 0) - 1}
                                    canComplete={canCompleteExecution(
                                        flowData.flow.version?.cards?.length || 0,
                                        cardStatuses
                                    )}
                                    isExecuting={isExecuting}
                                    onStatusChange={handleCardStatusChange}
                                    onNavigatePrevious={() => setCurrentCardIndex(prev => prev - 1)}
                                    onNavigateNext={() => setCurrentCardIndex(prev => prev + 1)}
                                    onComplete={handleCompleteExecution}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Evidence Panel */}
                    <div className="hidden lg:block">
                        <FlowEvidencePanel
                            cardId={currentCard.id}
                            evidences={currentCardData.evidences}
                            notes={currentCardData.notes}
                            onEvidencesChange={updateCardEvidences}
                            onNotesChange={updateCardNotes}
                            onUpload={handleEvidenceUpload}
                            isUploading={isUploading}
                        />
                    </div>
                </div>

                {/* Mobile Evidence Panel */}
                <div className="lg:hidden mt-6">
                    <FlowEvidencePanel
                        cardId={currentCard.id}
                        evidences={currentCardData.evidences}
                        notes={currentCardData.notes}
                        onEvidencesChange={updateCardEvidences}
                        onNotesChange={updateCardNotes}
                        onUpload={handleEvidenceUpload}
                        isUploading={isUploading}
                    />
                </div>
            </div>
        </div>
    )
}
