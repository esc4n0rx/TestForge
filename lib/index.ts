export { authClient } from "./api/auth/auth-client"
export { workspaceClient } from "./api/workspace/workspace-client"
export { billingClient } from "./api/billing/billing-client"
export { spaceClient } from "./api/space/space-client"
export { flowsClient } from "./api/flows/flows-client"
export { clientAuthClient } from "./api/client-auth/client-auth-client"
export { flowUseClient } from "./api/flow-use/flow-use-client"
export { flowUseUploadClient } from "./api/flow-use/flow-use-upload-client"
export { flowSessionsClient } from "./api/flow-sessions/flow-sessions-client"

// Re-export types for convenience
export type * from "./types/common"
export type * from "./types/auth"
export type * from "./types/workspace"
export type * from "./types/billing"
export type * from "./types/space"
export type * from "./types/flow"
export type * from "./types/client"
export type * from "./types/client-portal"

// Re-export flow helper functions and constants
export {
    FLOW_LIMITS,
    CARD_TYPES_BY_CATEGORY,
    CARD_TYPE_COMPATIBILITY,
    isCardTypeCompatible,
    getCompatibleCardTypes,
    parseCardConnections,
    stringifyCardConnections,
} from "./types/flow"

// Re-export utilities
export * from "./utils/plan-utils"
export * from "./utils/flow-utils"
