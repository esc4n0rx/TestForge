"use client"

import { Badge } from "@/components/ui/badge"
import { Workflow, Building2, Clock } from "lucide-react"
import { getSessionStatusColor, getSessionStatusText, formatSessionExpiry } from "@/lib/utils/flow-execution-utils"
import type { SessionStatus } from "@/lib/types/client-portal"

interface FlowSessionHeaderProps {
    flowName: string
    flowDescription?: string | null
    workspaceName: string
    sessionStatus: SessionStatus
    expiresAt: string
    clientName?: string
}

export function FlowSessionHeader({
    flowName,
    flowDescription,
    workspaceName,
    sessionStatus,
    expiresAt,
    clientName
}: FlowSessionHeaderProps) {
    return (
        <header className="border-b border-border bg-card">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Flow Info */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary flex-shrink-0">
                            <Workflow className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg sm:text-xl font-semibold truncate">{flowName}</h1>
                            {flowDescription && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {flowDescription}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>{workspaceName}</span>
                                </div>
                                {clientName && (
                                    <>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-xs text-muted-foreground">{clientName}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Session Status */}
                    <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
                        <Badge variant="outline" className={getSessionStatusColor(sessionStatus)}>
                            {getSessionStatusText(sessionStatus)}
                        </Badge>
                        {sessionStatus === 'ACTIVE' && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{formatSessionExpiry(expiresAt)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
