"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Workflow, CheckCircle2, Circle, Upload, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

// Mock flow data
const mockFlow = {
  id: "1",
  name: "Recebimento de Mercadoria EWM",
  module: "EWM",
  steps: [
    {
      id: "1",
      name: "Acessar transação MIGO",
      transaction: "MIGO",
      description: "Acesse a transação MIGO no SAP para iniciar o processo de recebimento",
      expectedResult: "Tela de MIGO deve ser exibida corretamente",
      status: "completed",
    },
    {
      id: "2",
      name: "Selecionar tipo de movimento",
      transaction: "MIGO",
      description: "Selecione o tipo de movimento 101 (Entrada de mercadoria para pedido de compra)",
      expectedResult: "Tipo de movimento 101 selecionado",
      status: "completed",
    },
    {
      id: "3",
      name: "Informar pedido de compra",
      transaction: "MIGO",
      description: "Digite o número do pedido de compra 4500001234",
      expectedResult: "Sistema deve carregar os dados do pedido automaticamente",
      status: "in-progress",
    },
    {
      id: "4",
      name: "Validar dados do pedido",
      description: "Verifique se os dados do pedido estão corretos (material, quantidade, preço)",
      expectedResult: "Todos os dados devem corresponder ao pedido original",
      status: "pending",
    },
    {
      id: "5",
      name: "Inserir quantidade recebida",
      description: "Informe a quantidade de material efetivamente recebida",
      expectedResult: "Quantidade inserida e validada pelo sistema",
      status: "pending",
    },
    {
      id: "6",
      name: "Confirmar recebimento",
      description: "Clique no botão de confirmação para finalizar o recebimento",
      expectedResult: "Documento de material criado com sucesso",
      status: "pending",
    },
  ],
}

export default function TestModePage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(2)
  const [comments, setComments] = useState<{ [key: string]: string }>({})
  const [newComment, setNewComment] = useState("")

  const currentStep = mockFlow.steps[currentStepIndex]
  const completedSteps = mockFlow.steps.filter((s) => s.status === "completed").length
  const progress = (completedSteps / mockFlow.steps.length) * 100

  const handleNextStep = () => {
    if (currentStepIndex < mockFlow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments({
        ...comments,
        [currentStep.id]: newComment,
      })
      setNewComment("")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Workflow className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{mockFlow.name}</h1>
                <p className="text-sm text-muted-foreground">Modo de Execução de Teste</p>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono">
              {mockFlow.module}
            </Badge>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Progresso: {completedSteps} de {mockFlow.steps.length} etapas
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr_350px]">
          {/* Left Sidebar - Flow Steps */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Etapas do Fluxo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockFlow.steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStepIndex(index)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      currentStepIndex === index
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {step.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-chart-2" />
                        ) : step.status === "in-progress" ? (
                          <div className="h-5 w-5 rounded-full border-2 border-primary bg-primary/20" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{step.name}</p>
                        {step.transaction && (
                          <p className="text-xs text-muted-foreground font-mono mt-1">{step.transaction}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Center - Current Step Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Etapa {currentStepIndex + 1}</Badge>
                      {currentStep.transaction && (
                        <Badge variant="secondary" className="font-mono">
                          {currentStep.transaction}
                        </Badge>
                      )}
                    </div>
                    <CardTitle>{currentStep.name}</CardTitle>
                  </div>
                  <div>
                    {currentStep.status === "completed" ? (
                      <Badge className="bg-chart-2 text-white">Concluída</Badge>
                    ) : currentStep.status === "in-progress" ? (
                      <Badge className="bg-primary">Em andamento</Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentStep.description}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Resultado Esperado</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentStep.expectedResult}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Anexar Evidência</h3>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Clique para fazer upload</p>
                    <p className="text-xs text-muted-foreground mt-1">ou arraste uma imagem aqui</p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={currentStepIndex === 0}
                    className="gap-2 bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>

                  <Button onClick={handleNextStep} disabled={currentStepIndex === mockFlow.steps.length - 1}>
                    Próxima
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Comments */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comentários
              </CardTitle>
              <CardDescription>Adicione observações sobre esta etapa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Comments */}
              {comments[currentStep.id] && (
                <div className="space-y-3 mb-4">
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">VC</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">Você</p>
                        <p className="text-xs text-muted-foreground">Agora</p>
                      </div>
                    </div>
                    <p className="text-sm">{comments[currentStep.id]}</p>
                  </div>
                </div>
              )}

              {/* New Comment */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Adicione um comentário sobre esta etapa..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleAddComment} className="w-full" disabled={!newComment.trim()}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Adicionar comentário
                </Button>
              </div>

              {/* Mock Previous Comments */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-chart-2 text-white">MC</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">Maria Costa</p>
                      <p className="text-xs text-muted-foreground">2 horas atrás</p>
                    </div>
                  </div>
                  <p className="text-sm">Sistema apresentou lentidão nesta etapa, mas consegui concluir.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
