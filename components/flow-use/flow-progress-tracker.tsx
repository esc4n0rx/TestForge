"use client"

import { Progress } from "@/components/ui/progress"
import { calculateProgress } from "@/lib/utils/flow-execution-utils"
import type { CardExecutionStatus } from "@/lib/types/flow"

interface FlowProgressTrackerProps {
    totalCards: number
    cardStatuses: Record<number, CardExecutionStatus>
}

export function FlowProgressTracker({ totalCards, cardStatuses }: FlowProgressTrackerProps) {
    const executedCount = Object.keys(cardStatuses).length
    const progress = calculateProgress(totalCards, cardStatuses)

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                    Progresso: {executedCount} de {totalCards} cards
                </span>
                <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
        </div>
    )
}
