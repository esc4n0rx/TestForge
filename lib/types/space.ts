// Space and file storage types

export interface Space {
    id: number
    workspaceId: number
    name: string
    description: string | null
    createdBy: number
    createdAt: string
    updatedAt: string
    files: SpaceFile[]
    _count: {
        files: number
    }
}

export interface SpaceFile {
    id: number
    spaceId: number
    workspaceId: number
    uploadedBy: number
    provider: string
    publicId: string
    secureUrl: string
    originalName: string
    originalFormat: string
    storedFormat: string
    bytes: number
    width: number | null
    height: number | null
    createdAt: string
}

export interface CreateSpaceRequest {
    workspaceId: number
    name: string
    description?: string
}

export interface UpdateSpaceRequest {
    name?: string
    description?: string
}

export interface SpaceStats {
    totalFiles: number
    totalBytes: number
    totalMB: string
    totalGB: string
    limit: number
    remaining: number
    percentageUsed: number
}

export interface UploadFileResponse {
    file: SpaceFile
    message: string
}
