"use client"

import type React from "react"

import { useState, useCallback } from "react"
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
import { Save, Play, FileText, CheckCircle2, Camera, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const colorOptions = [
  { name: "Roxo", value: "#9333ea" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#10b981" },
  { name: "Amarelo", value: "#f59e0b" },
  { name: "Vermelho", value: "#ef4444" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Ciano", value: "#06b6d4" },
  { name: "Laranja", value: "#f97316" },
]

const getNodeColor = (type: string) => {
  switch (type) {
    case "transaction":
      return "#3b82f6" // Blue
    case "validation":
      return "#10b981" // Green
    case "evidence":
      return "#f59e0b" // Yellow/Orange
    case "note":
      return "#8b5cf6" // Purple
    default:
      return "#9333ea" // Default purple
  }
}

const nodeTypes = {
  transaction: "transaction",
  validation: "validation",
  evidence: "evidence",
  note: "note",
}

const initialNodes: Node[] = [
  {
    id: "1",
    type: "default",
    data: { label: "Início", color: "#9333ea" },
    position: { x: 250, y: 50 },
    style: {
      background: "#9333ea",
      color: "#ffffff",
      border: "2px solid #a855f7",
      borderRadius: "12px",
      padding: "16px",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 4px 12px rgba(147, 51, 234, 0.3)",
    },
  },
]

const initialEdges: Edge[] = []

export default function FlowEditorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [nodeLabel, setNodeLabel] = useState("")
  const [nodeTransaction, setNodeTransaction] = useState("")
  const [nodeDescription, setNodeDescription] = useState("")
  const [nodeExpectedResult, setNodeExpectedResult] = useState("")
  const [nodeColor, setNodeColor] = useState("#9333ea") // Added state for node color

  const onConnect = useCallback(
    (params: Connection) => {
      // Get source node color for the edge
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
          eds,
        ),
      )
    },
    [setEdges, nodes],
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setNodeLabel(node.data.label || "")
    setNodeTransaction(node.data.transaction || "")
    setNodeDescription(node.data.description || "")
    setNodeExpectedResult(node.data.expectedResult || "")
    setNodeColor(node.data.color || getNodeColor(node.data.type)) // Set current node color
  }, [])

  const updateSelectedNode = () => {
    if (!selectedNode) return

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: nodeLabel,
              transaction: nodeTransaction,
              description: nodeDescription,
              expectedResult: nodeExpectedResult,
              color: nodeColor, // Save color to node data
            },
            style: {
              ...node.style,
              background: nodeColor,
              border: `2px solid ${nodeColor}`,
              color: "#ffffff",
              boxShadow: `0 4px 12px ${nodeColor}40`,
            },
          }
        }
        return node
      }),
    )

    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === selectedNode.id) {
          return {
            ...edge,
            style: {
              ...edge.style,
              stroke: nodeColor,
            },
          }
        }
        return edge
      }),
    )
  }

  const addNode = (type: string) => {
    const color = getNodeColor(type)
    const newNode: Node = {
      id: `${Date.now()}`,
      type: "default",
      data: {
        label: `Nova Etapa ${nodes.length}`,
        type,
        color,
      },
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 300 + 100,
      },
      style: {
        background: color,
        color: "#ffffff",
        border: `2px solid ${color}`,
        borderRadius: "12px",
        padding: "16px",
        fontSize: "14px",
        fontWeight: "500",
        boxShadow: `0 4px 12px ${color}40`,
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const updateNodeColor = (newColor: string) => {
    setNodeColor(newColor)
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                color: newColor,
              },
              style: {
                ...node.style,
                background: newColor,
                border: `2px solid ${newColor}`,
                boxShadow: `0 4px 12px ${newColor}40`,
              },
            }
          }
          return node
        }),
      )

      // Update connected edges
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.source === selectedNode.id) {
            return {
              ...edge,
              style: {
                ...edge.style,
                stroke: newColor,
              },
            }
          }
          return edge
        }),
      )
    }
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Node Types */}
      <div className="w-64 border-r border-border bg-muted/30 p-4 space-y-4 overflow-auto">
        <div>
          <h3 className="font-semibold mb-3">Tipos de Etapa</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-card hover:bg-accent"
              onClick={() => addNode("transaction")}
            >
              <FileText className="h-4 w-4" style={{ color: "#3b82f6" }} />
              Transação
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-card hover:bg-accent"
              onClick={() => addNode("validation")}
            >
              <CheckCircle2 className="h-4 w-4" style={{ color: "#10b981" }} />
              Validação
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-card hover:bg-accent"
              onClick={() => addNode("evidence")}
            >
              <Camera className="h-4 w-4" style={{ color: "#f59e0b" }} />
              Evidência
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-card hover:bg-accent"
              onClick={() => addNode("note")}
            >
              <MessageSquare className="h-4 w-4" style={{ color: "#8b5cf6" }} />
              Observação
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="font-semibold mb-3">Ações</h3>
          <div className="space-y-2">
            <Button variant="default" className="w-full gap-2">
              <Save className="h-4 w-4" />
              Salvar
            </Button>
            <Button variant="outline" className="w-full gap-2 bg-transparent">
              <Play className="h-4 w-4" />
              Executar Teste
            </Button>
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
            nodeColor={(node) => {
              return node.data.color || getNodeColor(node.data.type)
            }}
            nodeStrokeWidth={3}
            nodeBorderRadius={6}
          />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="hsl(var(--border))" />
        </ReactFlow>
      </div>

      {/* Right Panel - Node Properties */}
      <div className="w-80 border-l border-border bg-muted/30 p-4 overflow-auto">
        {selectedNode ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                Propriedades da Etapa
                {selectedNode.data.type && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedNode.data.type}
                  </Badge>
                )}
              </h3>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Nome da etapa</Label>
                  <Input
                    id="label"
                    value={nodeLabel}
                    onChange={(e) => setNodeLabel(e.target.value)}
                    onBlur={updateSelectedNode}
                    placeholder="Ex: Criar pedido de compra"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction">Transação SAP</Label>
                  <Input
                    id="transaction"
                    value={nodeTransaction}
                    onChange={(e) => setNodeTransaction(e.target.value)}
                    onBlur={updateSelectedNode}
                    placeholder="Ex: ME21N"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={nodeDescription}
                    onChange={(e) => setNodeDescription(e.target.value)}
                    onBlur={updateSelectedNode}
                    placeholder="Descreva o que deve ser feito nesta etapa"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected">Resultado esperado</Label>
                  <Textarea
                    id="expected"
                    value={nodeExpectedResult}
                    onChange={(e) => setNodeExpectedResult(e.target.value)}
                    onBlur={updateSelectedNode}
                    placeholder="Qual o resultado esperado desta etapa?"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cor da Etapa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => updateNodeColor(color.value)}
                      className="h-10 rounded-lg border-2 transition-all hover:scale-105"
                      style={{
                        backgroundColor: color.value,
                        borderColor: nodeColor === color.value ? "#ffffff" : color.value,
                        boxShadow: nodeColor === color.value ? `0 0 0 2px ${color.value}` : "none",
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  <Label htmlFor="customColor" className="text-xs">
                    Cor personalizada
                  </Label>
                  <Input
                    id="customColor"
                    type="color"
                    value={nodeColor}
                    onChange={(e) => updateNodeColor(e.target.value)}
                    className="h-10 cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea placeholder="Adicione observações sobre esta etapa..." rows={3} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Nenhuma etapa selecionada</h3>
            <p className="text-sm text-muted-foreground">Clique em uma etapa no canvas para editar suas propriedades</p>
          </div>
        )}
      </div>
    </div>
  )
}
