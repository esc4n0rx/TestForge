// Plan validation utilities for flow features

import type { Subscription } from '../types/billing'
import { FLOW_LIMITS, type FlowLimits } from '../types/flow'

/**
 * Get flow limits for a specific plan
 */
export function getFlowLimits(planCode: string): FlowLimits {
    return FLOW_LIMITS[planCode] || FLOW_LIMITS['forge_start']
}

/**
 * Check if a plan has a specific flow feature
 */
export function hasFlowFeature(
    subscription: Subscription | null,
    feature: keyof FlowLimits
): boolean {
    if (!subscription || subscription.status !== 'ACTIVE') {
        return false
    }

    const limits = getFlowLimits(subscription.plan.code)
    const value = limits[feature]

    // For boolean features
    if (typeof value === 'boolean') {
        return value
    }

    // For numeric features, check if > 0 or unlimited (-1)
    if (typeof value === 'number') {
        return value !== 0
    }

    return false
}

/**
 * Check if user can create more flows
 */
export function canCreateFlow(
    currentCount: number,
    planCode: string
): boolean {
    const limits = getFlowLimits(planCode)

    // -1 means unlimited
    if (limits.max_flows === -1) {
        return true
    }

    return currentCount < limits.max_flows
}

/**
 * Check if user can activate a flow (same as create, but different context)
 */
export function canActivateFlow(
    currentActiveCount: number,
    planCode: string
): boolean {
    const limits = getFlowLimits(planCode)

    // -1 means unlimited
    if (limits.max_flows === -1) {
        return true
    }

    return currentActiveCount < limits.max_flows
}

/**
 * Check if user can create more templates
 */
export function canCreateTemplate(
    currentCount: number,
    planCode: string
): boolean {
    const limits = getFlowLimits(planCode)

    // -1 means unlimited
    if (limits.flow_templates === -1) {
        return true
    }

    return currentCount < limits.flow_templates
}

/**
 * Check if versioning is available for the plan
 */
export function canUseVersioning(subscription: Subscription | null): boolean {
    return hasFlowFeature(subscription, 'flow_versioning')
}

/**
 * Check if environments are available for the plan
 */
export function canUseEnvironments(subscription: Subscription | null): boolean {
    return hasFlowFeature(subscription, 'flow_environments')
}

/**
 * Check if export is available for the plan
 */
export function canExportFlows(subscription: Subscription | null): boolean {
    return hasFlowFeature(subscription, 'flow_export')
}

/**
 * Check if execution logs are available for the plan
 */
export function canUseExecutionLogs(subscription: Subscription | null): boolean {
    return hasFlowFeature(subscription, 'flow_execution_logs')
}

/**
 * Get max flows limit for display
 */
export function getMaxFlowsDisplay(planCode: string): string {
    const limits = getFlowLimits(planCode)
    return limits.max_flows === -1 ? '∞' : limits.max_flows.toString()
}

/**
 * Get max templates limit for display
 */
export function getMaxTemplatesDisplay(planCode: string): string {
    const limits = getFlowLimits(planCode)
    return limits.flow_templates === -1 ? '∞' : limits.flow_templates.toString()
}

/**
 * Get usage percentage (0-100)
 */
export function getUsagePercentage(current: number, max: number): number {
    if (max === -1) return 0 // Unlimited
    if (max === 0) return 100
    return Math.min(100, Math.round((current / max) * 100))
}

/**
 * Check if approaching limit (>= 80%)
 */
export function isApproachingLimit(current: number, max: number): boolean {
    if (max === -1) return false // Unlimited
    return getUsagePercentage(current, max) >= 80
}

/**
 * Check if at limit
 */
export function isAtLimit(current: number, max: number): boolean {
    if (max === -1) return false // Unlimited
    return current >= max
}
