// Flow types matching backend API specification

// ============================================================================
// Enums
// ============================================================================

export type FlowType = 'TEST' | 'PROGRAM_FLOW' | 'PROCESS'

export type FlowEnvironment = 'NONE' | 'DEV' | 'QA' | 'STAGING' | 'PRODUCTION'

export type VersionStatus = 'DRAFT' | 'ACTIVE' | 'DELETED'

export type CardType =
    | 'START'
    | 'END'
    | 'ACTION'
    | 'EVENT'
    | 'DECISION'
    | 'ASSERT'
    | 'EVIDENCE'
    | 'ERROR'
    | 'CONDITION'
    | 'LOOP'
    | 'STATE'
    | 'COMMENT'
    | 'TECH_NOTE'

export type ExecutionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export type CardExecutionStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'SKIPPED'

// ============================================================================
// Data Models
// ============================================================================

export interface Flow {
    id: number
    workspaceId: number
    spaceId: number | null
    name: string
    description: string | null
    type: FlowType
    environment: FlowEnvironment
    isTemplate: boolean
    createdBy: number
    createdAt: string
    updatedAt: string
}

export interface FlowVersion {
    id: number
    flowId: number
    status: VersionStatus
    createdBy: number
    createdAt: string
}

export interface FlowCard {
    id: number
    versionId: number
    type: CardType
    title: string | null
    content: string | null
    notes: string | null
    positionX: number
    positionY: number
    connections: string // JSON array of card IDs
    createdAt: string
}

export interface FlowAttachment {
    id: number
    cardId: number
    provider: string
    publicId: string
    secureUrl: string
    originalName: string
    originalFormat: string
    storedFormat: string
    bytes: number
    width: number | null
    height: number | null
    uploadedBy: number
    createdAt: string
}

export interface FlowExecution {
    id: number
    flowId: number
    versionId: number
    executedBy: number | null
    clientEmail: string | null
    status: ExecutionStatus
    startedAt: string
    completedAt: string | null
    notes: string | null
    evidencesCount: number
}

export interface CardExecution {
    id: number
    executionId: number
    cardId: number
    status: CardExecutionStatus
    notes: string | null
    attachments: string | null // JSON array
    executedAt: string
}

// ============================================================================
// Extended Types
// ============================================================================

export interface FlowVersionWithCards extends FlowVersion {
    cards: FlowCard[]
}

export interface FlowCardWithAttachments extends FlowCard {
    attachments: FlowAttachment[]
}

export interface FlowWithDetails extends Flow {
    workspace: { id: number; name: string; slug: string }
    space: { id: number; name: string } | null
    creator: { id: number; nome: string; email: string }
    version: FlowVersionWithCards | null
}

// ============================================================================
// Request Types
// ============================================================================

export interface CreateFlowRequest {
    name: string
    description?: string
    type: FlowType
    environment?: FlowEnvironment
    isTemplate?: boolean
    spaceId?: number
}

export interface UpdateFlowRequest {
    name?: string
    description?: string
    environment?: FlowEnvironment
}

export interface ListFlowsFilters {
    type?: FlowType
    environment?: FlowEnvironment
    isTemplate?: boolean
    spaceId?: number
}



export interface AddCardRequest {
    type: CardType
    title?: string
    content?: string
    notes?: string
    positionX?: number
    positionY?: number
    connections?: number[]
}

export interface UpdateCardRequest {
    title?: string
    content?: string
    notes?: string
    positionX?: number
    positionY?: number
    connections?: number[]
}

export interface StartExecutionRequest {
    executedBy?: number
    clientEmail?: string
}

export interface UpdateExecutionRequest {
    status?: ExecutionStatus
    notes?: string
    completedAt?: string
}

export interface RecordCardExecutionRequest {
    status: CardExecutionStatus
    notes?: string
    attachments?: string
}

export interface CreateFlowFromTemplateRequest {
    name?: string
}

// ============================================================================
// Response Types
// ============================================================================

export interface FlowsListResponse {
    flows: FlowWithDetails[]
}

export interface FlowResponse {
    flow: FlowWithDetails
}



export interface VersionResponse {
    version: FlowVersionWithCards
}

export interface CardResponse {
    card: FlowCardWithAttachments
}

export interface AttachmentResponse {
    attachment: FlowAttachment
}

export interface ExecutionResponse {
    flow: FlowWithDetails
    execution: FlowExecution | null
}

// ============================================================================
// Plan Limits
// ============================================================================

export interface FlowLimits {
    max_flows: number // -1 = unlimited
    flow_execution_logs: boolean
    flow_export: boolean
    flow_templates: number // -1 = unlimited
    flow_environments: boolean
}

export const FLOW_LIMITS: Record<string, FlowLimits> = {
    'forge_start': {
        max_flows: 10,
        flow_execution_logs: false,
        flow_export: false,
        flow_templates: 5,
        flow_environments: false,
    },
    'forge_team': {
        max_flows: -1,
        flow_execution_logs: true,
        flow_export: true,
        flow_templates: -1,
        flow_environments: false,
    },
    'forge_enterprise': {
        max_flows: -1,
        flow_execution_logs: true,
        flow_export: true,
        flow_templates: -1,
        flow_environments: true,
    },
}

// ============================================================================
// Card Type Compatibility
// ============================================================================

export const CARD_TYPES_BY_CATEGORY = {
    structural: ['START', 'END'] as CardType[],
    action: ['ACTION', 'EVENT'] as CardType[],
    decision: ['DECISION', 'ASSERT'] as CardType[],
    evidence: ['EVIDENCE', 'ERROR'] as CardType[],
    technical: ['CONDITION', 'LOOP', 'STATE'] as CardType[],
    documentation: ['COMMENT', 'TECH_NOTE'] as CardType[],
}

export const CARD_TYPE_COMPATIBILITY: Record<FlowType, CardType[]> = {
    TEST: [
        ...CARD_TYPES_BY_CATEGORY.structural,
        ...CARD_TYPES_BY_CATEGORY.action,
        ...CARD_TYPES_BY_CATEGORY.decision,
        ...CARD_TYPES_BY_CATEGORY.evidence,
        ...CARD_TYPES_BY_CATEGORY.documentation,
    ],
    PROGRAM_FLOW: [
        ...CARD_TYPES_BY_CATEGORY.structural,
        ...CARD_TYPES_BY_CATEGORY.action,
        ...CARD_TYPES_BY_CATEGORY.decision,
        ...CARD_TYPES_BY_CATEGORY.technical,
        ...CARD_TYPES_BY_CATEGORY.documentation,
    ],
    PROCESS: [
        ...CARD_TYPES_BY_CATEGORY.structural,
        ...CARD_TYPES_BY_CATEGORY.action,
        ...CARD_TYPES_BY_CATEGORY.decision,
        ...CARD_TYPES_BY_CATEGORY.documentation,
    ],
}

// ============================================================================
// Helper Functions
// ============================================================================

export function isCardTypeCompatible(flowType: FlowType, cardType: CardType): boolean {
    return CARD_TYPE_COMPATIBILITY[flowType].includes(cardType)
}

export function getCompatibleCardTypes(flowType: FlowType): CardType[] {
    return CARD_TYPE_COMPATIBILITY[flowType]
}

export function parseCardConnections(connections: string): number[] {
    try {
        return JSON.parse(connections) as number[]
    } catch {
        return []
    }
}

export function stringifyCardConnections(connections: number[]): string {
    return JSON.stringify(connections)
}
