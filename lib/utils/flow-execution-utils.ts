import {
    CheckCircle2,
    XCircle,
    Circle,
    Forward,
    Play,
    Flag,
    Zap,
    AlertCircle,
    GitBranch,
    Shield,
    FileText,
    Bug,
    Repeat,
    Database,
    MessageSquare,
    Code,
    type LucideIcon
} from "lucide-react"
import type { CardType, CardExecutionStatus } from "@/lib/types/flow"
import type { SessionStatus } from "@/lib/types/client-portal"

/**
 * Check if a session has expired
 */
export function isSessionExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date()
}

/**
 * Check if a session is active (not expired, not revoked, not completed)
 */
export function isSessionActive(session: { status: SessionStatus; expiresAt: string }): boolean {
    return session.status === 'ACTIVE' && !isSessionExpired(session.expiresAt)
}

/**
 * Calculate execution progress percentage
 */
export function calculateProgress(
    totalCards: number,
    cardStatuses: Record<number, CardExecutionStatus>
): number {
    const executedCount = Object.keys(cardStatuses).length
    if (totalCards === 0) return 0
    return Math.round((executedCount / totalCards) * 100)
}

/**
 * Get Tailwind color class for card execution status
 */
export function getCardStatusColor(status: CardExecutionStatus): string {
    switch (status) {
        case 'PASSED':
            return 'text-green-600 bg-green-50 border-green-200'
        case 'FAILED':
            return 'text-red-600 bg-red-50 border-red-200'
        case 'SKIPPED':
            return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        case 'PENDING':
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200'
    }
}

/**
 * Get icon for card execution status
 */
export function getCardStatusIcon(status: CardExecutionStatus): LucideIcon {
    switch (status) {
        case 'PASSED':
            return CheckCircle2
        case 'FAILED':
            return XCircle
        case 'SKIPPED':
            return Forward
        case 'PENDING':
        default:
            return Circle
    }
}

/**
 * Get icon for card type
 */
export function getCardTypeIcon(type: CardType): LucideIcon {
    switch (type) {
        case 'START':
            return Play
        case 'END':
            return Flag
        case 'ACTION':
            return Zap
        case 'EVENT':
            return AlertCircle
        case 'DECISION':
            return GitBranch
        case 'ASSERT':
            return Shield
        case 'EVIDENCE':
            return FileText
        case 'ERROR':
            return Bug
        case 'CONDITION':
            return GitBranch
        case 'LOOP':
            return Repeat
        case 'STATE':
            return Database
        case 'COMMENT':
            return MessageSquare
        case 'TECH_NOTE':
            return Code
        default:
            return Circle
    }
}

/**
 * Get color for card type badge
 */
export function getCardTypeColor(type: CardType): string {
    switch (type) {
        case 'START':
            return 'bg-green-100 text-green-700 border-green-300'
        case 'END':
            return 'bg-red-100 text-red-700 border-red-300'
        case 'ACTION':
            return 'bg-blue-100 text-blue-700 border-blue-300'
        case 'EVENT':
            return 'bg-purple-100 text-purple-700 border-purple-300'
        case 'DECISION':
            return 'bg-yellow-100 text-yellow-700 border-yellow-300'
        case 'ASSERT':
            return 'bg-indigo-100 text-indigo-700 border-indigo-300'
        case 'EVIDENCE':
            return 'bg-teal-100 text-teal-700 border-teal-300'
        case 'ERROR':
            return 'bg-red-100 text-red-700 border-red-300'
        case 'CONDITION':
            return 'bg-orange-100 text-orange-700 border-orange-300'
        case 'LOOP':
            return 'bg-pink-100 text-pink-700 border-pink-300'
        case 'STATE':
            return 'bg-cyan-100 text-cyan-700 border-cyan-300'
        case 'COMMENT':
            return 'bg-gray-100 text-gray-700 border-gray-300'
        case 'TECH_NOTE':
            return 'bg-slate-100 text-slate-700 border-slate-300'
        default:
            return 'bg-gray-100 text-gray-700 border-gray-300'
    }
}

/**
 * Format session expiry time for display
 */
export function formatSessionExpiry(expiresAt: string): string {
    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const diffMs = expiryDate.getTime() - now.getTime()

    if (diffMs < 0) {
        return 'Expirado'
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 24) {
        const diffDays = Math.floor(diffHours / 24)
        return `Expira em ${diffDays} dia${diffDays > 1 ? 's' : ''}`
    } else if (diffHours > 0) {
        return `Expira em ${diffHours}h ${diffMinutes}m`
    } else {
        return `Expira em ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`
    }
}

/**
 * Format date/time for display in Brazilian Portuguese
 */
export function formatDateTime(isoDate: string): string {
    return new Date(isoDate).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Check if execution can be completed (all cards have been executed)
 */
export function canCompleteExecution(
    totalCards: number,
    cardStatuses: Record<number, CardExecutionStatus>
): boolean {
    return Object.keys(cardStatuses).length === totalCards
}

/**
 * Get session status badge color
 */
export function getSessionStatusColor(status: SessionStatus): string {
    switch (status) {
        case 'ACTIVE':
            return 'bg-green-100 text-green-700 border-green-300'
        case 'COMPLETED':
            return 'bg-blue-100 text-blue-700 border-blue-300'
        case 'EXPIRED':
            return 'bg-red-100 text-red-700 border-red-300'
        case 'REVOKED':
            return 'bg-red-100 text-red-700 border-red-300'
        default:
            return 'bg-gray-100 text-gray-700 border-gray-300'
    }
}

/**
 * Get friendly session status text
 */
export function getSessionStatusText(status: SessionStatus): string {
    switch (status) {
        case 'ACTIVE':
            return 'Ativa'
        case 'COMPLETED':
            return 'Concluída'
        case 'EXPIRED':
            return 'Expirada'
        case 'REVOKED':
            return 'Revogada'
        default:
            return status
    }
}

/**
 * Get friendly card status text
 */
export function getCardStatusText(status: CardExecutionStatus): string {
    switch (status) {
        case 'PASSED':
            return 'Aprovado'
        case 'FAILED':
            return 'Falhou'
        case 'SKIPPED':
            return 'Pulado'
        case 'PENDING':
            return 'Pendente'
        default:
            return status
    }
}

/**
 * Parse attachments JSON string to array
 */
export function parseAttachments(attachments: string | null): string[] {
    if (!attachments) return []
    try {
        return JSON.parse(attachments) as string[]
    } catch {
        return []
    }
}

/**
 * Build access URL for a flow session
 */
export function buildFlowAccessUrl(token: string): string {
    if (typeof window === 'undefined') {
        return `/flow-use/${token}`
    }
    return `${window.location.origin}/flow-use/${token}`
}
