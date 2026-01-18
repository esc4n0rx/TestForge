"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, Trash2, Download, ZoomIn } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { spaceClient, type Space, type SpaceFile, type SpaceStats } from "@/lib"
import { FileUploadDialog } from "@/components/file-upload-dialog"
import { StorageStatsCard } from "@/components/storage-stats-card"
import Link from "next/link"

export default function SpaceDetailPage() {
    const params = useParams()
    const router = useRouter()
    const spaceId = Number(params.id)
    const { toast } = useToast()
    const { workspace, subscription } = useAuth()

    const [space, setSpace] = useState<Space | null>(null)
    const [files, setFiles] = useState<SpaceFile[]>([])
    const [stats, setStats] = useState<SpaceStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<SpaceFile | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Pagination
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const limit = 20

    const workspaceId = workspace?.id

    useEffect(() => {
        if (workspaceId) {
            loadData()
        }
    }, [spaceId, workspaceId])

    const loadData = async () => {
        if (!workspaceId) return
        setLoading(true)
        try {
            const [spaceRes, filesRes, statsRes] = await Promise.all([
                spaceClient.getSpace(spaceId, workspaceId!),
                spaceClient.getFiles(spaceId, limit, offset, workspaceId!),
                spaceClient.getSpaceStats(workspaceId!),
            ])

            if (spaceRes.success && spaceRes.data) {
                setSpace(spaceRes.data.space)
            } else {
                toast({
                    title: "Space não encontrado",
                    description: "O space solicitado não existe",
                    variant: "destructive",
                })
                router.push("/dashboard/spaces")
                return
            }

            if (filesRes.success && filesRes.data) {
                const filesList = filesRes.data.files || (Array.isArray(filesRes.data) ? filesRes.data : [])
                setFiles(filesList)
                setHasMore(filesList.length === limit)
            }

            if (statsRes.success && statsRes.data) {
                setStats(statsRes.data.stats)
            }
        } catch (error) {
            toast({
                title: "Erro ao carregar dados",
                description: "Não foi possível carregar o space",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (file: File) => {
        const response = await spaceClient.uploadFile(spaceId, file)

        if (response.success && response.data) {
            setFiles([response.data.file, ...files])

            // Update space file count
            if (space) {
                const currentFiles = space._count?.files ?? 0
                setSpace({
                    ...space,
                    _count: { files: currentFiles + 1 }
                })
            }

            // Reload stats
            const statsRes = await spaceClient.getSpaceStats(workspaceId!)
            if (statsRes.success && statsRes.data) {
                setStats(statsRes.data.stats)
            }
        } else {
            throw new Error(response.error?.message || "Erro ao fazer upload")
        }
    }

    const handleDelete = async () => {
        if (!selectedFile) return

        setDeleting(true)
        try {
            const response = await spaceClient.deleteFile(spaceId, selectedFile.id)

            if (response.success) {
                setFiles(files.filter(f => f.id !== selectedFile.id))

                // Update space file count
                if (space) {
                    const currentFiles = space._count?.files ?? 0
                    setSpace({
                        ...space,
                        _count: { files: Math.max(0, currentFiles - 1) }
                    })
                }

                // Reload stats
                const statsRes = await spaceClient.getSpaceStats(workspaceId!)
                if (statsRes.success && statsRes.data) {
                    setStats(statsRes.data.stats)
                }

                setDeleteDialogOpen(false)
                setSelectedFile(null)
                toast({
                    title: "Arquivo deletado",
                    description: "Arquivo removido com sucesso",
                })
            } else {
                toast({
                    title: "Erro ao deletar arquivo",
                    description: response.error?.message || "Erro desconhecido",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Erro ao deletar arquivo",
                description: "Falha na comunicação com o servidor",
                variant: "destructive",
            })
        } finally {
            setDeleting(false)
        }
    }

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    }

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date)
    }

    const openDeleteDialog = (file: SpaceFile) => {
        setSelectedFile(file)
        setDeleteDialogOpen(true)
    }

    const openViewDialog = (file: SpaceFile) => {
        setSelectedFile(file)
        setViewDialogOpen(true)
    }

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">Carregando...</p>
            </div>
        )
    }

    if (!space) {
        return null
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="space-y-4">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/spaces">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Spaces
                    </Link>
                </Button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{space.name}</h1>
                        {space.description && (
                            <p className="text-muted-foreground mt-1">{space.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                            <Badge variant="secondary">
                                {(space._count?.files ?? 0)} {(space._count?.files ?? 0) === 1 ? "arquivo" : "arquivos"}
                            </Badge>
                        </div>
                    </div>
                    <Button size="lg" onClick={() => setUploadDialogOpen(true)}>
                        <Upload className="mr-2 h-5 w-5" />
                        Upload
                    </Button>
                </div>
            </div>

            {/* Storage Stats */}
            {stats && (
                <div className="max-w-md">
                    <StorageStatsCard stats={stats} planName={subscription?.plan.name} />
                </div>
            )}

            {/* Files Grid */}
            {files.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                            <Upload className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">Nenhum arquivo</h3>
                        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                            Faça upload de evidências para este space
                        </p>
                        <Button className="mt-6" onClick={() => setUploadDialogOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Fazer Upload
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Arquivos</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {files.map((file) => (
                            <Card key={file.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="relative aspect-video bg-muted overflow-hidden">
                                    <img
                                        src={file.secureUrl}
                                        alt={file.originalName}
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => openViewDialog(file)}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            onClick={() => openViewDialog(file)}
                                        >
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            asChild
                                        >
                                            <a href={file.secureUrl} download={file.originalName} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            onClick={() => openDeleteDialog(file)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardHeader className="p-4">
                                    <CardTitle className="text-sm truncate">{file.originalName}</CardTitle>
                                    <CardDescription className="text-xs">
                                        <div className="flex items-center justify-between">
                                            <span>{formatBytes(file.bytes)}</span>
                                            <span>{file.storedFormat.toUpperCase()}</span>
                                        </div>
                                        <div className="mt-1 text-xs">
                                            {formatDate(file.createdAt)}
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination */}
                    {hasMore && (
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    const newOffset = offset + limit
                                    const response = await spaceClient.getFiles(spaceId, limit, newOffset, workspaceId!)
                                    if (response.success && response.data) {
                                        const newFiles = response.data.files || (Array.isArray(response.data) ? response.data : [])
                                        setFiles([...files, ...newFiles])
                                        setOffset(newOffset)
                                        setHasMore(newFiles.length === limit)
                                    }
                                }}
                            >
                                Carregar mais
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Dialog */}
            <FileUploadDialog
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                onUpload={handleUpload}
            />

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deletar Arquivo</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja deletar "{selectedFile?.originalName}"?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <p className="text-sm text-destructive font-medium">
                            ⚠️ Esta ação não pode ser desfeita
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deletando..." : "Deletar Arquivo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{selectedFile?.originalName}</DialogTitle>
                        <DialogDescription>
                            {selectedFile && (
                                <div className="flex items-center gap-4 text-sm">
                                    <span>{formatBytes(selectedFile.bytes)}</span>
                                    <span>•</span>
                                    <span>{selectedFile.width} × {selectedFile.height}px</span>
                                    <span>•</span>
                                    <span>{formatDate(selectedFile.createdAt)}</span>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedFile && (
                        <div className="relative w-full max-h-[70vh] overflow-auto">
                            <img
                                src={selectedFile.secureUrl}
                                alt={selectedFile.originalName}
                                className="w-full h-auto"
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" asChild>
                            <a href={selectedFile?.secureUrl} download={selectedFile?.originalName} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </a>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
