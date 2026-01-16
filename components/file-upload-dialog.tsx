"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, FileImage } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileUploadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpload: (file: File) => Promise<void>
    maxSizeMB?: number
    allowedTypes?: string[]
}

const DEFAULT_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]
const DEFAULT_MAX_SIZE_MB = 25

export function FileUploadDialog({
    open,
    onOpenChange,
    onUpload,
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
}: FileUploadDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [dragActive, setDragActive] = useState(false)
    const { toast } = useToast()

    const validateFile = (file: File): string | null => {
        if (!allowedTypes.includes(file.type)) {
            return `Tipo de arquivo não permitido. Apenas ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`
        }

        const maxSizeBytes = maxSizeMB * 1024 * 1024
        if (file.size > maxSizeBytes) {
            return `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`
        }

        return null
    }

    const handleFileSelect = (file: File) => {
        const error = validateFile(file)
        if (error) {
            toast({
                title: "Arquivo inválido",
                description: error,
                variant: "destructive",
            })
            return
        }

        setSelectedFile(file)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0])
        }
    }, [])

    const handleUpload = async () => {
        if (!selectedFile) return

        setUploading(true)
        setUploadProgress(0)

        // Simulate progress (since we don't have real progress from fetch)
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 200)

        try {
            await onUpload(selectedFile)
            setUploadProgress(100)

            toast({
                title: "Upload concluído",
                description: "Arquivo enviado com sucesso!",
            })

            // Reset state
            setSelectedFile(null)
            setPreview(null)
            onOpenChange(false)
        } catch (error) {
            toast({
                title: "Erro no upload",
                description: error instanceof Error ? error.message : "Falha ao enviar arquivo",
                variant: "destructive",
            })
        } finally {
            clearInterval(progressInterval)
            setUploading(false)
            setUploadProgress(0)
        }
    }

    const handleClose = () => {
        if (!uploading) {
            setSelectedFile(null)
            setPreview(null)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload de Evidência</DialogTitle>
                    <DialogDescription>
                        Envie uma imagem (PNG, JPG, WEBP, GIF) de até {maxSizeMB}MB
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {!selectedFile ? (
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm font-medium">
                                Arraste uma imagem ou clique para selecionar
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                PNG, JPG, WEBP, GIF até {maxSizeMB}MB
                            </p>
                            <input
                                type="file"
                                accept={allowedTypes.join(",")}
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        handleFileSelect(e.target.files[0])
                                    }
                                }}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload">
                                <Button variant="outline" className="mt-4" asChild>
                                    <span>Selecionar arquivo</span>
                                </Button>
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative rounded-lg border overflow-hidden">
                                {preview && (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full h-48 object-cover"
                                    />
                                )}
                                {!uploading && (
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2"
                                        onClick={() => {
                                            setSelectedFile(null)
                                            setPreview(null)
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <FileImage className="h-4 w-4 text-muted-foreground" />
                                <span className="flex-1 truncate">{selectedFile.name}</span>
                                <span className="text-muted-foreground">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>

                            {uploading && (
                                <div className="space-y-2">
                                    <Progress value={uploadProgress} />
                                    <p className="text-xs text-center text-muted-foreground">
                                        Enviando... {uploadProgress}%
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleClose}
                                    disabled={uploading}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleUpload}
                                    disabled={uploading}
                                >
                                    {uploading ? "Enviando..." : "Enviar"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
