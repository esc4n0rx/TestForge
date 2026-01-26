"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Loader2, Lightbulb, AlertCircle } from "lucide-react"
import type { FlowType, FlowEnvironment } from "@/lib"

interface AIFlowModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    flowType: FlowType
    spaceId: number | null
    environment: FlowEnvironment
    onGenerate: (description: string) => Promise<void>
    isGenerating: boolean
}

const FLOW_TYPE_LABELS: Record<FlowType, string> = {
    TEST: "Teste (QA)",
    PROGRAM_FLOW: "Fluxo de Programa",
    PROCESS: "Processo",
}

const PROMPT_TIPS = [
    "Seja específico: Descreva claramente cada passo que você espera no flow",
    "Inclua validações: Mencione explicitamente o que deve ser validado/verificado",
    "Defina cenários: Se houver múltiplos caminhos (sucesso/erro), descreva cada um",
    "Use contexto: Explique o objetivo geral do flow além dos passos técnicos",
]

const GOOD_EXAMPLES: Record<FlowType, string> = {
    TEST: "Criar flow de teste de cadastro de usuário. Deve incluir: abrir página /register, preencher nome, email e senha, aceitar termos, submeter formulário, validar se email de confirmação foi enviado, e verificar se usuário aparece na listagem de usuários pendentes.",
    PROGRAM_FLOW: "Criar flow lógico para processar pedido de compra. Receber pedido → Validar estoque → Se disponível: calcular frete, processar pagamento, atualizar estoque, enviar confirmação. Se indisponível: notificar cliente e sugerir alternativas.",
    PROCESS: "Criar flow de processo de aprovação de férias. Funcionário solicita férias → Gerente avalia → Se aprovado: RH registra → Notifica funcionário. Se rejeitado: Notifica motivo → Funcionário pode revisar solicitação.",
}

export function AIFlowModal({
    open,
    onOpenChange,
    flowType,
    spaceId,
    environment,
    onGenerate,
    isGenerating,
}: AIFlowModalProps) {
    const [description, setDescription] = useState("")
    const [error, setError] = useState("")

    const handleGenerate = async () => {
        // Validate description length
        if (description.length < 10) {
            setError("Descrição muito curta. Mínimo de 10 caracteres.")
            return
        }

        if (description.length > 2000) {
            setError("Descrição muito longa. Máximo de 2000 caracteres.")
            return
        }

        setError("")
        await onGenerate(description)
    }

    const handleClose = () => {
        if (!isGenerating) {
            setDescription("")
            setError("")
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        Gerar Flow com IA
                    </DialogTitle>
                    <DialogDescription>
                        Descreva o flow que você deseja criar e a IA gerará automaticamente os cards e conexões.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Flow Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div>
                            <span className="font-medium">Tipo:</span> {FLOW_TYPE_LABELS[flowType]}
                        </div>
                        {environment !== "NONE" && (
                            <div>
                                <span className="font-medium">Ambiente:</span> {environment}
                            </div>
                        )}
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <Label htmlFor="ai-description">
                            Descrição do Flow
                            <span className="text-xs text-muted-foreground ml-2">
                                ({description.length}/2000 caracteres)
                            </span>
                        </Label>
                        <Textarea
                            id="ai-description"
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value)
                                setError("")
                            }}
                            placeholder={GOOD_EXAMPLES[flowType]}
                            rows={8}
                            className="resize-none"
                            disabled={isGenerating}
                        />
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Tips */}
                    <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                            <div className="font-medium mb-2">Dicas para melhores resultados:</div>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {PROMPT_TIPS.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>

                    {/* Example */}
                    <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="text-sm font-medium mb-2">Exemplo para {FLOW_TYPE_LABELS[flowType]}:</div>
                        <p className="text-sm text-muted-foreground italic">
                            "{GOOD_EXAMPLES[flowType]}"
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isGenerating}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || description.length < 10}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Gerando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Gerar Flow
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
