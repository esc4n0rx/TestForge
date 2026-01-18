import type { FlowWithDetails, FlowVersion, FlowCard, CardType } from "../types/flow"

/**
 * Obtem a versao atual de um flow
 * Versoes vem ordenadas por versionNumber DESC
 */
export function getFlowVersion(flow: FlowWithDetails | null): FlowVersion | null {
    if (!flow) return null
    // Prefere currentVersion se disponivel (tem cards incluidos)
    if (flow.currentVersion) {
        return flow.currentVersion
    }
    // Fallback para array versions
    return flow.versions?.[0] || null
}

/**
 * Obtem o ID da versao para operacoes com cards
 */
export function getVersionId(flow: FlowWithDetails | null): number | undefined {
    if (!flow) return undefined
    return flow.currentVersionId || flow.versions?.[0]?.id
}

/**
 * Verifica se o flow esta ativo (pode ser executado)
 */
export function isFlowActive(flow: FlowWithDetails | null): boolean {
    if (!flow) return false
    const version = flow.versions?.[0]
    return version?.status === 'ACTIVE'
}

/**
 * Verifica se o flow pode ser editado (apenas DRAFT)
 */
export function canEditFlow(flow: FlowWithDetails | null): boolean {
    if (!flow) return false
    const version = flow.versions?.[0]
    return version?.status === 'DRAFT'
}

/**
 * Verifica se o flow esta deletado
 */
export function isFlowDeleted(flow: FlowWithDetails | null): boolean {
    if (!flow) return false
    const version = flow.versions?.[0]
    return version?.status === 'DELETED'
}

/**
 * Obtem os cards de um flow
 * Pode buscar de currentVersion ou da versao mais recente no array versions
 */
export function getFlowCards(flow: FlowWithDetails | null): FlowCard[] {
    if (!flow) return []
    // Se temos currentVersion com cards, usamos ela (geralmente quando ACTIVE)
    if (flow.currentVersion?.cards) {
        return flow.currentVersion.cards
    }

    // Se nao, tentamos pegar da versao mais recente no array (geralmente DRAFT)
    // Nota: O backend pode nao incluir cards no array de versoes resumido, 
    // mas se o objeto flow vier de getFlow(id), ele deve estar populado.
    const latestVersion = flow.versions?.[0] as any
    return latestVersion?.cards || []
}

/**
 * Parseia o campo connections de um card
 */
export function parseConnections(card: FlowCard): number[] {
    try {
        return JSON.parse(card.connections || '[]')
    } catch {
        return []
    }
}

/**
 * Verifica se um tipo de card e permitido para um tipo de flow
 */
export function isCardTypeAllowedForFlow(flowType: string, cardType: CardType): boolean {
    const testOnly = ['ASSERT', 'EVIDENCE', 'ERROR']
    const programFlowOnly = ['CONDITION', 'LOOP', 'STATE']

    if (testOnly.includes(cardType)) {
        return flowType === 'TEST'
    }

    if (programFlowOnly.includes(cardType)) {
        return flowType === 'PROGRAM_FLOW'
    }

    return true // Cards comuns sao permitidos em todos
}

/**
 * Obtem tipos de cards disponiveis para um tipo de flow
 */
export function getAvailableCardTypesForFlow(flowType: string): CardType[] {
    const common: CardType[] = ['START', 'END', 'ACTION', 'EVENT', 'DECISION', 'COMMENT', 'TECH_NOTE']

    switch (flowType) {
        case 'TEST':
            return [...common, 'ASSERT', 'EVIDENCE', 'ERROR']
        case 'PROGRAM_FLOW':
            return [...common, 'CONDITION', 'LOOP', 'STATE']
        case 'PROCESS':
        default:
            return common
    }
}
