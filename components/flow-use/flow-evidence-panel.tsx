"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, FileImage, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface Evidence {
    url: string
    name: string
}

interface FlowEvidencePanelProps {
    cardId: number
    evidences: Evidence[]
    notes: string
    onEvidencesChange: (evidences: Evidence[]) => void
    onNotesChange: (notes: string) => void
    onUpload?: (file: File) => Promise<string | null>
    isUploading?: boolean
}

export function FlowEvidencePanel({
    cardId,
    evidences,
    notes,
    onEvidencesChange,
    onNotesChange,
    onUpload,
    isUploading = false
}: FlowEvidencePanelProps) {
    const { toast } = useToast()
    const [isDragging, setIsDragging] = useState(false)

    const handleFileSelect = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return
        if (!onUpload) {
            toast({
                title: "Upload não disponível",
                description: "A funcionalidade de upload não está configurada",
                variant: "destructive"
            })
            return
        }

        const file = files[0]

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Tipo de arquivo inválido",
                description: "Apenas imagens são permitidas",
                variant: "destructive"
            })
            return
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: "Arquivo muito grande",
                description: "O tamanho máximo permitido é 10MB",
                variant: "destructive"
            })
            return
        }

        try {
            const url = await onUpload(file)
            if (url) {
                onEvidencesChange([...evidences, { url, name: file.name }])
                toast({
                    title: "Evidência anexada",
                    description: "O arquivo foi enviado com sucesso"
                })
            }
        } catch (error) {
            toast({
                title: "Erro ao enviar arquivo",
                description: "Não foi possível fazer upload da evidência",
                variant: "destructive"
            })
        }
    }, [evidences, onEvidencesChange, onUpload, toast])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        handleFileSelect(e.dataTransfer.files)
    }, [handleFileSelect])

    const removeEvidence = useCallback((index: number) => {
        onEvidencesChange(evidences.filter((_, i) => i !== index))
    }, [evidences, onEvidencesChange])

    return (
        <Card className="h-fit">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <FileImage className="h-5 w-5" />
                    Evidências & Notas
                </CardTitle>
                <CardDescription>
                    Anexe evidências e adicione observações sobre este card
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Upload Area */}
                <div>
                    <h3 className="font-semibold mb-3 text-sm">Anexar Evidência</h3>
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                            isDragging
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-accent/50"
                        )}
                    >
                        <input
                            type="file"
                            id={`evidence-upload-${cardId}`}
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files)}
                            className="hidden"
                            disabled={isUploading}
                        />
                        <label
                            htmlFor={`evidence-upload-${cardId}`}
                            className="cursor-pointer"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
                                    <p className="text-sm font-medium">Enviando...</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm font-medium">Clique para fazer upload</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        ou arraste uma imagem aqui
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        PNG, JPG até 10MB
                                    </p>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                {/* Uploaded Evidences */}
                {evidences.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-3 text-sm">
                            Evidências Anexadas ({evidences.length})
                        </h3>
                        <div className="space-y-2">
                            {evidences.map((evidence, index) => (
                                <div
                                    key={index}
                                    className="relative group rounded-lg overflow-hidden border border-border"
                                >
                                    <div className="aspect-video relative">
                                        <Image
                                            src={evidence.url}
                                            alt={evidence.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="p-2 bg-muted/50 flex items-center justify-between">
                                        <p className="text-xs truncate flex-1">{evidence.name}</p>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeEvidence(index)}
                                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div>
                    <h3 className="font-semibold mb-3 text-sm">Observações</h3>
                    <Textarea
                        placeholder="Adicione observações sobre a execução deste card..."
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        rows={4}
                        className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        {notes.length} / 2000 caracteres
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
