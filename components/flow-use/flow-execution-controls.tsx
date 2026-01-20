"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Forward, ChevronLeft, ChevronRight, Flag } from "lucide-react"
import type { CardExecutionStatus } from "@/lib/types/flow"

interface FlowExecutionControlsProps {
    currentCardIndex: number
    totalCards: number
    currentCardStatus: CardExecutionStatus | undefined
    canNavigatePrevious: boolean
    canNavigateNext: boolean
    canComplete: boolean
    isExecuting: boolean
    onStatusChange: (status: CardExecutionStatus) => void
    onNavigatePrevious: () => void
    onNavigateNext: () => void
    onComplete: () => void
}

export function FlowExecutionControls({
    currentCardIndex,
    totalCards,
    currentCardStatus,
    canNavigatePrevious,
    canNavigateNext,
    canComplete,
    isExecuting,
    onStatusChange,
    onNavigatePrevious,
    onNavigateNext,
    onComplete
}: FlowExecutionControlsProps) {
    const isLastCard = currentCardIndex === totalCards - 1

    return (
        <div className="space-y-4">
            {/* Status Actions */}
            {!currentCardStatus && (
                <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Marcar como:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Button
                            onClick={() => onStatusChange('PASSED')}
                            disabled={isExecuting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Aprovado
                        </Button>
                        <Button
                            onClick={() => onStatusChange('FAILED')}
                            disabled={isExecuting}
                            variant="destructive"
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Falhou
                        </Button>
                        <Button
                            onClick={() => onStatusChange('SKIPPED')}
                            disabled={isExecuting}
                            variant="outline"
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                        >
                            <Forward className="mr-2 h-4 w-4" />
                            Pular
                        </Button>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2 border-t">
                <Button
                    variant="outline"
                    onClick={onNavigatePrevious}
                    disabled={!canNavigatePrevious || isExecuting}
                    className="gap-2"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                </Button>

                {isLastCard && canComplete ? (
                    <Button
                        onClick={onComplete}
                        disabled={isExecuting}
                        className="gap-2 bg-primary"
                    >
                        <Flag className="h-4 w-4" />
                        Finalizar Execução
                    </Button>
                ) : (
                    <Button
                        onClick={onNavigateNext}
                        disabled={!canNavigateNext || isExecuting}
                        className="gap-2"
                    >
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Status Indicator */}
            {currentCardStatus && (
                <div className="text-center text-sm text-muted-foreground">
                    Card marcado como:{" "}
                    <span className="font-medium">
                        {currentCardStatus === 'PASSED' && 'Aprovado'}
                        {currentCardStatus === 'FAILED' && 'Falhou'}
                        {currentCardStatus === 'SKIPPED' && 'Pulado'}
                    </span>
                </div>
            )}
        </div>
    )
}
