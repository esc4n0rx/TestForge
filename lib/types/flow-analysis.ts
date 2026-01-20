// Flow Analysis Types
export type AnalysisExecutionStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED"
export type AnalysisCardExecutionStatus = "PENDING" | "PASSED" | "FAILED" | "SKIPPED"

export interface AnalysisExecutionSummary {
    id: number
    flowId: number
    flowName: string
    flowType: string
    client: {
        id: number
        name: string
        email: string
        company?: string
    } | null
    clientEmail: string | null
    status: AnalysisExecutionStatus
    startedAt: string
    completedAt: string | null
    duration: number | null
    totalCards: number
    completedCards: number
    passedCards: number
    failedCards: number
    skippedCards: number
    evidencesCount: number
}

export interface AnalysisCardExecution {
    id: number
    cardId: number
    card: {
        id: number
        type: string
        title: string | null
        content: string | null
    }
    status: AnalysisCardExecutionStatus
    notes: string | null
    attachments: string | null // JSON stringified array of URLs
    executedAt: string
}

export interface AnalysisExecutionDetails {
    id: number
    flowId: number
    flow: {
        id: number
        name: string
        description: string | null
        type: string
        workspace: {
            id: number
            name: string
            slug: string
        }
    }
    session: {
        id: number
        token: string
        status: string
        createdAt: string
        expiresAt: string
    } | null
    client: {
        id: number
        name: string
        email: string
        company?: string
    } | null
    clientEmail: string | null
    status: AnalysisExecutionStatus
    startedAt: string
    completedAt: string | null
    notes: string | null
    evidencesCount: number
    cardExecutions: AnalysisCardExecution[]
}

export interface FlowStatistics {
    flowId: number
    flowName: string
    totalExecutions: number
    completedExecutions: number
    failedExecutions: number
    inProgressExecutions: number
    averageDuration: number | null
    totalClients: number
    successRate: number
    lastExecution: string | null
}

export interface WorkspaceStatistics {
    totalExecutions: number
    completedExecutions: number
    failedExecutions: number
    inProgressExecutions: number
    flowsWithExecutions: number
    totalClients: number
    successRate: number
}

export interface ExecutionFilters {
    flowId?: number
    clientId?: number
    status?: AnalysisExecutionStatus
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
}

export interface ClientExecutionFilters {
    flowId?: number
    status?: AnalysisExecutionStatus
    limit?: number
    offset?: number
}

// API Response Types
export interface ExecutionsListResponse {
    executions: AnalysisExecutionSummary[]
    total: number
}

export interface ExecutionDetailsResponse {
    execution: AnalysisExecutionDetails
}

export interface FlowStatisticsResponse {
    statistics: FlowStatistics
}

export interface WorkspaceStatisticsResponse {
    statistics: WorkspaceStatistics
}
