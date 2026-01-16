import { BaseApiClient } from "../base-client"
import type { ApiResponse } from "../../types/common"
import type {
    Space,
    SpaceFile,
    CreateSpaceRequest,
    UpdateSpaceRequest,
    SpaceStats,
    UploadFileResponse
} from "../../types/space"

class SpaceClient extends BaseApiClient {
    private readonly SPACE_BASE: string

    constructor() {
        super()
        this.SPACE_BASE = `${this.getApiUrl()}/api/spaces`
    }

    async getSpaces(workspaceId: number): Promise<ApiResponse<{ spaces: Space[] }>> {
        return this.request<{ spaces: Space[] }>(`?workspaceId=${workspaceId}`, {
            method: "GET",
        }, this.SPACE_BASE)
    }

    async getSpace(id: number): Promise<ApiResponse<{ space: Space }>> {
        return this.request<{ space: Space }>(`/${id}`, {
            method: "GET",
        }, this.SPACE_BASE)
    }

    async getSpaceStats(workspaceId: number): Promise<ApiResponse<{ stats: SpaceStats }>> {
        return this.request<{ stats: SpaceStats }>(`/stats?workspaceId=${workspaceId}`, {
            method: "GET",
        }, this.SPACE_BASE)
    }

    async createSpace(data: CreateSpaceRequest): Promise<ApiResponse<{ space: Space }>> {
        return this.request<{ space: Space }>("", {
            method: "POST",
            body: JSON.stringify(data),
        }, this.SPACE_BASE)
    }

    async updateSpace(id: number, data: UpdateSpaceRequest): Promise<ApiResponse<{ space: Space }>> {
        return this.request<{ space: Space }>(`/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }, this.SPACE_BASE)
    }

    async deleteSpace(id: number): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(`/${id}`, {
            method: "DELETE",
        }, this.SPACE_BASE)
    }

    async uploadFile(spaceId: number, file: File): Promise<ApiResponse<UploadFileResponse>> {
        const formData = new FormData()
        formData.append("file", file)

        // Override the default request method for multipart/form-data
        try {
            const response = await fetch(`${this.SPACE_BASE}/${spaceId}/files`, {
                method: "POST",
                body: formData,
                credentials: "include",
            })

            const data: ApiResponse<UploadFileResponse> = await response.json()

            if (!response.ok) {
                return data
            }

            return data
        } catch (error) {
            return {
                success: false,
                error: {
                    message: "Erro ao fazer upload do arquivo. Verifique sua conexão.",
                    code: "NETWORK_ERROR",
                },
            }
        }
    }

    async getFiles(
        spaceId: number,
        limit: number = 20,
        offset: number = 0
    ): Promise<ApiResponse<{ files: SpaceFile[] }>> {
        return this.request<{ files: SpaceFile[] }>(
            `/${spaceId}/files?limit=${limit}&offset=${offset}`,
            {
                method: "GET",
            },
            this.SPACE_BASE
        )
    }

    async getFile(spaceId: number, fileId: number): Promise<ApiResponse<{ file: SpaceFile }>> {
        return this.request<{ file: SpaceFile }>(`/${spaceId}/files/${fileId}`, {
            method: "GET",
        }, this.SPACE_BASE)
    }

    async deleteFile(spaceId: number, fileId: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return this.request<{ success: boolean; message: string }>(`/${spaceId}/files/${fileId}`, {
            method: "DELETE",
        }, this.SPACE_BASE)
    }
}

export const spaceClient = new SpaceClient()
