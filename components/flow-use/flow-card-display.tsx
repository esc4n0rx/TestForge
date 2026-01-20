"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getCardTypeIcon, getCardTypeColor } from "@/lib/utils/flow-execution-utils"
import type { CardType } from "@/lib/types/flow"
import Image from "next/image"

interface FlowCardAttachment {
    id: number
    secureUrl: string
    originalName: string
}

interface FlowCardDisplayProps {
    cardNumber: number
    totalCards: number
    type: CardType
    title: string | null
    content: string | null
    notes: string | null
    attachments: FlowCardAttachment[]
}

export function FlowCardDisplay({
    cardNumber,
    totalCards,
    type,
    title,
    content,
    notes,
    attachments
}: FlowCardDisplayProps) {
    const CardIcon = getCardTypeIcon(type)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline">
                                Card {cardNumber} de {totalCards}
                            </Badge>
                            <Badge variant="outline" className={getCardTypeColor(type)}>
                                <CardIcon className="h-3 w-3 mr-1" />
                                {type}
                            </Badge>
                        </div>
                        <CardTitle className="text-xl">{title || 'Sem título'}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Content */}
                {content && (
                    <div>
                        <h3 className="font-semibold mb-2 text-sm">Descrição</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {content}
                        </p>
                    </div>
                )}

                {/* Notes */}
                {notes && (
                    <>
                        <Separator />
                        <div>
                            <h3 className="font-semibold mb-2 text-sm">Notas</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {notes}
                            </p>
                        </div>
                    </>
                )}

                {/* Attachments */}
                {attachments.length > 0 && (
                    <>
                        <Separator />
                        <div>
                            <h3 className="font-semibold mb-3 text-sm">
                                Anexos ({attachments.length})
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {attachments.map((attachment) => (
                                    <a
                                        key={attachment.id}
                                        href={attachment.secureUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative aspect-video rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                                    >
                                        <Image
                                            src={attachment.secureUrl}
                                            alt={attachment.originalName}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                            <p className="text-xs text-white truncate">
                                                {attachment.originalName}
                                            </p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
