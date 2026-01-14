// Barrel export for API clients
export { authClient } from "./api/auth/auth-client"
export { workspaceClient } from "./api/workspace/workspace-client"
export { billingClient } from "./api/billing/billing-client"

// Re-export types for convenience
export type * from "./types/common"
export type * from "./types/auth"
export type * from "./types/workspace"
export type * from "./types/billing"
