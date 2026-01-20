"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCardStatusIcon, getCardTypeIcon } from "@/lib/utils/flow-execution-utils"
import type { CardType, CardExecutionStatus } from "@/lib/types/flow"
import { cn } from "@/lib/utils"

interface FlowCard {
    id: number
    type: string
    title: string | null
}

interface FlowCardsSidebarProps {
    cards: FlowCard[]
    currentCardIndex: number
    cardStatuses: Record<number, CardExecutionStatus>
    onCardSelect: (index: number) => void
}

export function FlowCardsSidebar({
    cards,
    currentCardIndex,
    cardStatuses,
    onCardSelect
}: FlowCardsSidebarProps) {
    return (
        <Card className="h-fit">
            <CardHeader>
                <CardTitle className="text-base">Cards do Flow</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-16rem)] px-4 pb-4">
                    <div className="space-y-2">
                        {cards.map((card, index) => {
                            const status = cardStatuses[card.id] || 'PENDING'
                            const StatusIcon = getCardStatusIcon(status)
                            const TypeIcon = getCardTypeIcon(card.type as CardType)
                            const isActive = currentCardIndex === index

                            return (
                                <button
                                    key={card.id}
                                    onClick={() => onCardSelect(index)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg border transition-all",
                                        isActive
                                            ? "border-primary bg-primary/10 shadow-sm"
                                            : "border-border bg-card hover:bg-accent hover:border-accent-foreground/20"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Status Icon */}
                                        <div className="mt-0.5 flex-shrink-0">
                                            <StatusIcon
                                                className={cn(
                                                    "h-5 w-5",
                                                    status === 'PASSED' && "text-green-600",
                                                    status === 'FAILED' && "text-red-600",
                                                    status === 'SKIPPED' && "text-yellow-600",
                                                    status === 'PENDING' && "text-muted-foreground"
                                                )}
                                            />
                                        </div>

                                        {/* Card Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    #{index + 1}
                                                </span>
                                                <TypeIcon className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium line-clamp-2">
                                                {card.title || 'Sem título'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {card.type}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
