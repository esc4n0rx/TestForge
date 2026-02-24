// Client portal types for flow execution

// ============================================================================
// Client Authentication Types
// ============================================================================

export interface ClientPortalUser {
    id: number
    nome: string
    email: string
    company: string | null
}

export interface ClientWorkspace {
    id: number
    name: string
    slug: string
}

export interface ClientAuthData {
    clientId: number
    workspaceId: number
    nome: string
    email: string
    company: string | null
    workspace: ClientWorkspace
}

export interface ClientLoginRequest {
    email: string
    senha: string
    workspaceSlug: string
}

export interface ClientLoginResponse {
    client: ClientPortalUser
    workspace: ClientWorkspace
}

export interface ClientChangePasswordRequest {
    currentPassword: string
    newPassword: string
}

// ============================================================================
// Session Types
// ============================================================================

export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REVOKED'

export interface FlowSession {
    id: number
    token: string
    flowId: number
    clientId: number
    workspaceId: number
    status: SessionStatus
    createdAt: string
    expiresAt: string
    lastAccessAt: string | null
    completedAt: string | null
}

export interface FlowSessionWithDetails extends FlowSession {
    flow: {
        id: number
        name: string
        type: string
    }
    client: {
        id: number
        nome: string
        email: string
    }
}

export interface CreateSessionRequest {
    flowId: number
    clientId: number
    expiresInHours?: number
}

export interface CreateSessionResponse {
    session: FlowSession
    accessUrl: string
}

export interface CreateSessionsBatchRequest {
    flowIds: number[]
    clientIds: number[]
    expiresInHours?: number
}

export interface CreateSessionsBatchSummary {
    requestedPairs: number
    processedPairs: number
    created: number
    conflicts: number
    errors: number
}

export interface CreateSessionsBatchCreatedItem {
    flowId: number
    clientId: number
    sessionId: number
    token: string
    accessUrl: string
    expiresAt: string
}

export interface CreateSessionsBatchIssueItem {
    flowId: number
    clientId: number
    code: string
    message: string
}

export interface CreateSessionsBatchResponse {
    summary: CreateSessionsBatchSummary
    created: CreateSessionsBatchCreatedItem[]
    conflicts: CreateSessionsBatchIssueItem[]
    errors: CreateSessionsBatchIssueItem[]
}

export interface RevokeSessionsBatchRequest {
    sessionIds?: number[]
    clientIds?: number[]
    flowIds?: number[]
    onlyActive?: boolean
}

export interface RevokeSessionsBatchSummary {
    matched: number
    revoked: number
    alreadyRevoked: number
    notFoundSessionIds: number
}

export interface RevokeSessionsBatchResponse {
    summary: RevokeSessionsBatchSummary
    matchedSessionIds: number[]
    revokedSessionIds: number[]
    alreadyRevokedSessionIds: number[]
    notFoundSessionIds: number[]
}

// ============================================================================
// Execution Types (imports from flow.ts)
// ============================================================================

// Note: ExecutionStatus, CardExecutionStatus, StartExecutionRequest, RecordCardExecutionRequest
// are already defined in flow.ts and will be imported from there

export interface FlowExecutionRecord {
    id: number
    flowId: number
    versionId: number
    sessionId: number | null
    executedBy: number | null
    clientEmail: string | null
    status: string // ExecutionStatus from flow.ts
    startedAt: string
    completedAt: string | null
    notes: string | null
    evidencesCount: number
}

export interface CardExecutionRecord {
    id: number
    executionId: number
    cardId: number
    status: string // CardExecutionStatus from flow.ts
    notes: string | null
    attachments: string | null // JSON array
    executedAt: string
}

export interface CardExecutionWithCard extends CardExecutionRecord {
    card: {
        id: number
        type: string
        title: string | null
    }
}

export interface FlowExecutionWithDetails extends FlowExecutionRecord {
    flow: {
        id: number
        name: string
        type: string
    }
    cardExecutions: CardExecutionWithCard[]
}

// ============================================================================
// Request/Response Types (specific to client portal)
// ============================================================================

// Note: StartExecutionRequest and RecordCardExecutionRequest are in flow.ts

export interface StartExecutionResponse {
    session: FlowSessionWithDetails
    execution: FlowExecutionRecord | null
    message: string
}

export interface CompleteExecutionRequest {
    notes?: string
    status?: "COMPLETED" | "FAILED"
}

export interface SignExecutionRequest {
    signerName: string
    signatureData?: string
}

export interface SignExecutionResponse {
    sessionId: number
    signerName: string
    signerIp: string
    signedAt: string
    message: string
}

// ============================================================================
// Client Flow Types
// ============================================================================

export interface ClientFlowSummary {
    id: number
    name: string
    description: string | null
    type: string
    environment: string
    versionNumber: number
    totalCards: number
}

export type ClientFlowDisplayStatus =
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "FAILED"
    | "EXPIRED"
    | "REVOKED"

export interface ClientFlowProgressSummary {
    totalFlows: number
    notStarted: number
    inProgress: number
    completed: number
    failed: number
    expired: number
    revoked: number
}

export interface ClientFlowProgressItem {
    flow: {
        id: number
        name: string
        type: string
        environment: string
    }
    session: {
        id: number
        status: SessionStatus
        createdAt: string
        expiresAt: string
        completedAt: string | null
        lastAccessAt: string | null
    }
    progress: {
        percent: number
        totalCards: number
        completedCards: number
        pendingCards: number
        passedCards: number
        failedCards: number
        skippedCards: number
    }
    execution: {
        id: number
        status: "IN_PROGRESS" | "COMPLETED" | "FAILED"
        startedAt: string
        completedAt: string | null
    } | null
    displayStatus: ClientFlowDisplayStatus
}

export interface ClientSession {
    id: number
    token: string
    flowId: number
    status: SessionStatus
    expiresAt: string
    flow: {
        id: number
        name: string
        type: string
    }
}

export interface ClientExecution {
    id: number
    flowId: number
    status: string // ExecutionStatus from flow.ts
    startedAt: string
    completedAt: string | null
    flow: {
        id: number
        name: string
        type: string
    }
}

// ============================================================================
// Flow Use Response Types
// ============================================================================

export interface FlowUseSessionResponse {
    session: {
        id: number
        token: string
        status: SessionStatus
        expiresAt: string
        client: ClientPortalUser
        workspace: ClientWorkspace
    }
    flow: {
        id: number
        name: string
        type: string
        version: {
            id: number
            cards: Array<{
                id: number
                type: string
                title: string | null
                content: string | null
                notes: string | null
                positionX: number
                positionY: number
                connections: string
                attachments: Array<{
                    id: number
                    secureUrl: string
                    originalName: string
                }>
            }>
        } | null
    }
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ClientFlowsResponse {
    flows: ClientFlowSummary[]
}

export interface ClientFlowsProgressResponse {
    summary: ClientFlowProgressSummary
    flows: ClientFlowProgressItem[]
}

export interface ClientSessionsResponse {
    sessions: ClientSession[]
}

export interface ClientExecutionsResponse {
    executions: ClientExecution[]
}

export interface SessionsListResponse {
    sessions: FlowSessionWithDetails[]
}
