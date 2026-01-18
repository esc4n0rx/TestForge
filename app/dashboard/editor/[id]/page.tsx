"use client"

import { useState, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Save,
  Play,
  FileText,
  CheckCircle2,
  Camera,
  MessageSquare,
  Loader2,
  Upload,
  X,
  GitBranch,
  Power,
  PowerOff,
  Download,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import {
  flowsClient,
  type FlowWithDetails,
  type FlowCard,
  type CardType,
  type FlowType,
  type FlowEnvironment,
  type FlowAttachment,
  getCompatibleCardTypes,
  isCardTypeCompatible,
  parseCardConnections,
  stringifyCardConnections,
  canUseVersioning,
  canUseEnvironments,
  canExportFlows,
  canActivateFlow,
} from "@/lib"

// Card type configurations with icons and colors
const CARD_TYPE_CONFIG: Record<CardType, { icon: any; color: string; label: string }> = {
  START: { icon: Play, color: "#10b981", label: "Início" },
  END: { icon: CheckCircle2, color: "#ef4444", label: "Fim" },
  ACTION: { icon: FileText, color: "#3b82f6", label: "Ação" },
  EVENT: { icon: FileText, color: "#8b5cf6", label: "Evento" },
  DECISION: { icon: FileText, color: "#f59e0b", label: "Decisão" },
  ASSERT: { icon: CheckCircle2, color: "#10b981", label: "Asserção" },
  EVIDENCE: { icon: Camera, color: "#f59e0b", label: "Evidência" },
  ERROR: { icon: AlertCircle, color: "#ef4444", label: "Erro" },
  CONDITION: { icon: FileText, color: "#06b6d4", label: "Condição" },
  LOOP: { icon: FileText, color: "#ec4899", label: "Loop" },
  STATE: { icon: FileText, color: "#8b5cf6", label: "Estado" },
  COMMENT: { icon: MessageSquare, color: "#6b7280", label: "Comentário" },
  TECH_NOTE: { icon: MessageSquare, color: "#9333ea", label: "Nota Técnica" },
}

export default function FlowEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { subscription, workspace } = useAuth()
  const flowId = params.id as string
  const isNewFlow = flowId === "new"

  // Flow state
  const [flow, setFlow] = useState<FlowWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(!isNewFlow)
  const [isSaving, setIsSaving] = useState(false)

  // Flow metadata
  const [flowName, setFlowName] = useState("")
  const [flowDescription, setFlowDescription] = useState("")
  const [flowType, setFlowType] = useState<FlowType>("TEST")
  const [flowEnvironment, setFlowEnvironment] = useState<FlowEnvironment>("NONE")

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  // Card editing state
  const [cardTitle, setCardTitle] = useState("")
  const [cardContent, setCardContent] = useState("")
  const [cardNotes, setCardNotes] = useState("")
  const [cardAttachments, setCardAttachments] = useState<FlowAttachment[]>([])
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)

  // Versioning state
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [versionChangeLog, setVersionChangeLog] = useState("")

  // Activation state
  const [showActivationDialog, setShowActivationDialog] = useState(false)
  const [activationAction, setActivationAction] = useState<"activate" | "deactivate">("activate")

  // Feature flags
  const hasVersioning = canUseVersioning(subscription)
  const hasEnvironments = canUseEnvironments(subscription)
  const hasExport = canExportFlows(subscription)

  // Load flow on mount
  useEffect(() => {
    if (!isNewFlow) {
      loadFlow()
    }
  }, [flowId])

  const loadFlow = async () => {
    setIsLoading(true)
    try {
      const response = await flowsClient.getFlow(Number(flowId))

      if (response.success && response.data) {
        const loadedFlow = response.data.flow
        setFlow(loadedFlow)
        setFlowName(loadedFlow.name)
        setFlowDescription(loadedFlow.description || "")
        setFlowType(loadedFlow.type)
        setFlowEnvironment(loadedFlow.environment)

        // Convert cards to React Flow nodes and edges
        if (loadedFlow.currentVersion?.cards) {
          convertCardsToNodesAndEdges(loadedFlow.currentVersion.cards)
        }
      } else {
        toast.error(response.error?.message || "Erro ao carregar flow")
        router.push("/dashboard")
      }
    } catch (error) {
      toast.error("Erro ao carregar flow")
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const convertCardsToNodesAndEdges = (cards: FlowCard[]) => {
    const newNodes: Node[] = cards.map((card) => {
      const config = CARD_TYPE_CONFIG[card.type]
      return {
        id: String(card.id),
        type: "default",
        data: {
          label: card.title || config.label,
          cardId: card.id,
          cardType: card.type,
          color: config.color,
        },
        position: { x: card.positionX, y: card.positionY },
        style: {
          background: config.color,
          color: "#ffffff",
          border: `2px solid ${config.color}`,
          borderRadius: "12px",
          padding: "16px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: `0 4px 12px ${config.color}40`,
        },
      }
    })

    const newEdges: Edge[] = []
    cards.forEach((card) => {
      const connections = parseCardConnections(card.connections)
      connections.forEach((targetId) => {
        const sourceNode = newNodes.find((n) => n.data.cardId === card.id)
        if (sourceNode) {
          newEdges.push({
            id: `${card.id}-${targetId}`,
            source: String(card.id),
            target: String(targetId),
            animated: true,
            style: {
              stroke: sourceNode.data.color,
              strokeWidth: 2.5,
            },
            type: "smoothstep",
          })
        }
      })
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }

  const saveFlow = async () => {
    if (!flowName.trim()) {
      toast.error("Nome do flow é obrigatório")
      return
    }

    setIsSaving(true)
    try {
      if (isNewFlow) {
        // Create new flow
        const response = await flowsClient.createFlow({
          name: flowName,
          description: flowDescription || undefined,
          type: flowType,
          environment: hasEnvironments ? flowEnvironment : "NONE",
        })

        if (response.success && response.data) {
          const createdFlow = response.data.flow
          setFlow(createdFlow)
          toast.success("Flow criado com sucesso")
          // Update URL without full page reload
          window.history.replaceState(null, "", `/dashboard/editor/${createdFlow.id}`)
        } else {
          toast.error(response.error?.message || "Erro ao criar flow")
        }
      } else {
        // Update existing flow
        const response = await flowsClient.updateFlow(Number(flowId), {
          name: flowName,
          description: flowDescription || undefined,
          environment: hasEnvironments ? flowEnvironment : undefined,
        })

        if (response.success) {
          toast.success("Flow salvo com sucesso")
          await loadFlow()
        } else {
          toast.error(response.error?.message || "Erro ao salvar flow")
        }
      }
    } catch (error) {
      toast.error("Erro ao salvar flow")
    } finally {
      setIsSaving(false)
    }
  }

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source)
      const edgeColor = sourceNode?.data.color || "#9333ea"

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: {
              stroke: edgeColor,
              strokeWidth: 2.5,
            },
            type: "smoothstep",
          },
          eds
        )
      )

      // Update card connections in backend
      if (sourceNode?.data.cardId && params.target) {
        updateCardConnections(sourceNode.data.cardId, params.target, "add")
      }
    },
    [setEdges, nodes]
  )

  const updateCardConnections = async (
    cardId: number,
    targetId: string,
    action: "add" | "remove"
  ) => {
    if (!flow?.currentVersion) return

    const card = flow.currentVersion.cards.find((c) => c.id === cardId)
    if (!card) return

    const currentConnections = parseCardConnections(card.connections)
    const targetCardId = Number(targetId)

    let newConnections: number[]
    if (action === "add") {
      newConnections = [...currentConnections, targetCardId]
    } else {
      newConnections = currentConnections.filter((id) => id !== targetCardId)
    }

    try {
      await flowsClient.updateCard(cardId, {
        connections: newConnections,
      })
    } catch (error) {
      toast.error("Erro ao atualizar conexões")
    }
  }

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node)

      // Load card data
      if (flow?.currentVersion && node.data.cardId) {
        const card = flow.currentVersion.cards.find((c) => c.id === node.data.cardId)
        if (card) {
          setCardTitle(card.title || "")
          setCardContent(card.content || "")
          setCardNotes(card.notes || "")
          setCardAttachments(card.attachments || [])
        }
      }
    },
    [flow]
  )

  const updateSelectedCard = async () => {
    if (!selectedNode || !selectedNode.data.cardId) return

    try {
      const response = await flowsClient.updateCard(selectedNode.data.cardId, {
        title: cardTitle || undefined,
        content: cardContent || undefined,
        notes: cardNotes || undefined,
      })

      if (response.success) {
        // Update node label
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === selectedNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  label: cardTitle || CARD_TYPE_CONFIG[node.data.cardType].label,
                },
              }
            }
            return node
          })
        )
        toast.success("Card atualizado")
      } else {
        toast.error(response.error?.message || "Erro ao atualizar card")
      }
    } catch (error) {
      toast.error("Erro ao atualizar card")
    }
  }

  const addCard = async (type: CardType) => {
    if (!flow?.currentVersion) {
      toast.error("Salve o flow antes de adicionar cards")
      return
    }

    if (!isCardTypeCompatible(flowType, type)) {
      toast.error(`Card tipo ${type} não é compatível com flow tipo ${flowType}`)
      return
    }

    try {
      const config = CARD_TYPE_CONFIG[type]
      const response = await flowsClient.addCard(flow.currentVersion.id, {
        type,
        title: config.label,
        positionX: Math.random() * 500 + 100,
        positionY: Math.random() * 300 + 100,
      })

      if (response.success && response.data) {
        const newCard = response.data.card
        const newNode: Node = {
          id: String(newCard.id),
          type: "default",
          data: {
            label: newCard.title || config.label,
            cardId: newCard.id,
            cardType: type,
            color: config.color,
          },
          position: { x: newCard.positionX, y: newCard.positionY },
          style: {
            background: config.color,
            color: "#ffffff",
            border: `2px solid ${config.color}`,
            borderRadius: "12px",
            padding: "16px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: `0 4px 12px ${config.color}40`,
          },
        }
        setNodes((nds) => [...nds, newNode])
        toast.success("Card adicionado")
      } else {
        toast.error(response.error?.message || "Erro ao adicionar card")
      }
    } catch (error) {
      toast.error("Erro ao adicionar card")
    }
  }

  const uploadAttachment = async (file: File) => {
    if (!selectedNode?.data.cardId) return

    setIsUploadingAttachment(true)
    try {
      const response = await flowsClient.uploadAttachment(selectedNode.data.cardId, file)

      if (response.success && response.data) {
        setCardAttachments([...cardAttachments, response.data.attachment])
        toast.success("Anexo enviado com sucesso")
      } else {
        toast.error(response.error?.message || "Erro ao enviar anexo")
      }
    } catch (error) {
      toast.error("Erro ao enviar anexo")
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  const deleteAttachment = async (attachmentId: number) => {
    try {
      const response = await flowsClient.deleteAttachment(attachmentId)

      if (response.success) {
        setCardAttachments(cardAttachments.filter((a) => a.id !== attachmentId))
        toast.success("Anexo removido")
      } else {
        toast.error(response.error?.message || "Erro ao remover anexo")
      }
    } catch (error) {
      toast.error("Erro ao remover anexo")
    }
  }

  const createVersion = async () => {
    if (!flow) return

    try {
      const response = await flowsClient.createVersion(flow.id, {
        changeLog: versionChangeLog || undefined,
      })

      if (response.success) {
        toast.success("Nova versão criada")
        setShowVersionDialog(false)
        setVersionChangeLog("")
        await loadFlow()
      } else {
        toast.error(response.error?.message || "Erro ao criar versão")
      }
    } catch (error) {
      toast.error("Erro ao criar versão")
    }
  }

  const toggleActivation = async () => {
    if (!flow || !workspace) return

    try {
      if (activationAction === "activate") {
        // Check if can activate
        const activeFlowsCount = 0 // TODO: Get from API or context
        if (!canActivateFlow(activeFlowsCount, subscription?.plan.code || "forge_start")) {
          toast.error("Limite de flows ativos atingido. Faça upgrade do plano.")
          return
        }

        const response = await flowsClient.activateVersion(
          flow.id,
          flow.currentVersion!.id
        )

        if (response.success) {
          toast.success("Flow ativado")
          await loadFlow()
        } else {
          toast.error(response.error?.message || "Erro ao ativar flow")
        }
      } else {
        const response = await flowsClient.deactivateFlow(flow.id)

        if (response.success) {
          toast.success("Flow desativado")
          await loadFlow()
        } else {
          toast.error(response.error?.message || "Erro ao desativar flow")
        }
      }
    } catch (error) {
      toast.error("Erro ao alterar status do flow")
    } finally {
      setShowActivationDialog(false)
    }
  }

  const handleExport = () => {
    if (!flow) return

    const exportUrl = flowsClient.getExportUrl(flow.id, "pdf", {
      includeCards: true,
      includeAttachments: true,
      includeVersionHistory: hasVersioning,
    })

    window.open(exportUrl, "_blank")
  }

  const compatibleCardTypes = getCompatibleCardTypes(flowType)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando flow...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <Input
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              onBlur={saveFlow}
              placeholder="Nome do flow"
              className="text-lg font-semibold"
            />
            <div className="flex items-center gap-4">
              <Select value={flowType} onValueChange={(v) => setFlowType(v as FlowType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEST">Teste (QA)</SelectItem>
                  <SelectItem value="PROGRAM_FLOW">Fluxo de Programa</SelectItem>
                  <SelectItem value="PROCESS">Processo</SelectItem>
                </SelectContent>
              </Select>

              {hasEnvironments && (
                <Select
                  value={flowEnvironment}
                  onValueChange={(v) => setFlowEnvironment(v as FlowEnvironment)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Nenhum</SelectItem>
                    <SelectItem value="DEV">Desenvolvimento</SelectItem>
                    <SelectItem value="QA">QA</SelectItem>
                    <SelectItem value="STAGING">Staging</SelectItem>
                    <SelectItem value="PRODUCTION">Produção</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {flow?.currentVersion && (
                <Badge variant={flow.currentVersion.status === "ACTIVE" ? "default" : "secondary"}>
                  {flow.currentVersion.status}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasVersioning && !isNewFlow && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersionDialog(true)}
              >
                <GitBranch className="mr-2 h-4 w-4" />
                Nova Versão
              </Button>
            )}

            {hasExport && !isNewFlow && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            )}

            {!isNewFlow && flow?.currentVersion && (
              <Button
                variant={flow.currentVersion.status === "ACTIVE" ? "destructive" : "default"}
                size="sm"
                onClick={() => {
                  setActivationAction(
                    flow.currentVersion!.status === "ACTIVE" ? "deactivate" : "activate"
                  )
                  setShowActivationDialog(true)
                }}
              >
                {flow.currentVersion.status === "ACTIVE" ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    Ativar
                  </>
                )}
              </Button>
            )}

            <Button onClick={saveFlow} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Card Types */}
        <div className="w-64 border-r border-border bg-muted/30 p-4 space-y-4 overflow-auto">
          <div>
            <h3 className="font-semibold mb-3">Tipos de Card</h3>
            <div className="space-y-2">
              {compatibleCardTypes.map((type) => {
                const config = CARD_TYPE_CONFIG[type]
                const Icon = config.icon
                return (
                  <Button
                    key={type}
                    variant="outline"
                    className="w-full justify-start gap-2 bg-card hover:bg-accent"
                    onClick={() => addCard(type)}
                  >
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                    {config.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            className="bg-background"
          >
            <Controls className="bg-card border-border" />
            <MiniMap
              style={{
                background: "hsl(var(--card))",
                border: "2px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              }}
              maskColor="rgba(0, 0, 0, 0.6)"
              nodeColor={(node) => node.data.color || "#9333ea"}
              nodeStrokeWidth={3}
              nodeBorderRadius={6}
            />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="hsl(var(--border))" />
          </ReactFlow>
        </div>

        {/* Right Panel - Card Properties */}
        <div className="w-80 border-l border-border bg-muted/30 p-4 overflow-auto">
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Propriedades do Card
                  <Badge variant="secondary" className="text-xs">
                    {selectedNode.data.cardType}
                  </Badge>
                </h3>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={cardTitle}
                      onChange={(e) => setCardTitle(e.target.value)}
                      onBlur={updateSelectedCard}
                      placeholder="Título do card"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Conteúdo</Label>
                    <Textarea
                      id="content"
                      value={cardContent}
                      onChange={(e) => setCardContent(e.target.value)}
                      onBlur={updateSelectedCard}
                      placeholder="Descrição detalhada"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={cardNotes}
                      onChange={(e) => setCardNotes(e.target.value)}
                      onBlur={updateSelectedCard}
                      placeholder="Observações adicionais"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Anexos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadAttachment(file)
                      }}
                      disabled={isUploadingAttachment}
                      className="cursor-pointer"
                    />
                  </div>

                  {cardAttachments.length > 0 && (
                    <div className="space-y-2">
                      {cardAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <span className="text-sm truncate flex-1">
                            {attachment.originalName}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteAttachment(attachment.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Nenhum card selecionado</h3>
              <p className="text-sm text-muted-foreground">
                Clique em um card no canvas para editar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Version Dialog */}
      <AlertDialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Criar Nova Versão</AlertDialogTitle>
            <AlertDialogDescription>
              Isso criará uma cópia da versão atual para edição. A versão atual permanecerá inalterada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="changelog">Changelog (opcional)</Label>
            <Textarea
              id="changelog"
              value={versionChangeLog}
              onChange={(e) => setVersionChangeLog(e.target.value)}
              placeholder="Descreva as mudanças nesta versão..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={createVersion}>Criar Versão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activation Dialog */}
      <AlertDialog open={showActivationDialog} onOpenChange={setShowActivationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {activationAction === "activate" ? "Ativar Flow" : "Desativar Flow"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activationAction === "activate"
                ? "Ativar este flow permitirá que ele seja executado publicamente."
                : "Desativar este flow impedirá execuções públicas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={toggleActivation}>
              {activationAction === "activate" ? "Ativar" : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
