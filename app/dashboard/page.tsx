"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Share2, Trash2, ExternalLink, Plus } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Mock data
const mockFlows = [
  {
    id: "1",
    name: "Recebimento de Mercadoria EWM",
    module: "EWM",
    steps: 8,
    lastUpdated: "2 horas atrás",
    status: "active",
  },
  {
    id: "2",
    name: "Criação de Pedido de Compra MM",
    module: "MM",
    steps: 5,
    lastUpdated: "1 dia atrás",
    status: "active",
  },
  {
    id: "3",
    name: "Processamento de Ordem de Venda SD",
    module: "SD",
    steps: 12,
    lastUpdated: "3 dias atrás",
    status: "draft",
  },
  {
    id: "4",
    name: "Aprovação de Requisição de Compra",
    module: "MM",
    steps: 6,
    lastUpdated: "5 dias atrás",
    status: "active",
  },
  {
    id: "5",
    name: "Transferência entre Centros",
    module: "MM",
    steps: 9,
    lastUpdated: "1 semana atrás",
    status: "active",
  },
  {
    id: "6",
    name: "Contagem de Inventário WM",
    module: "WM",
    steps: 7,
    lastUpdated: "2 semanas atrás",
    status: "draft",
  },
]

export default function FlowsPage() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null)

  const handleShare = (flowId: string) => {
    setSelectedFlow(flowId)
    setShareDialogOpen(true)
  }

  const publicUrl = selectedFlow ? `https://testflow.app/test/${selectedFlow}` : ""

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flows</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus cenários de teste</p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/editor/new">
            <Plus className="mr-2 h-5 w-5" />
            Novo Flow
          </Link>
        </Button>
      </div>

      {mockFlows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Plus className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhum flow criado</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              Comece criando seu primeiro flow de teste para documentar seus cenários
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/editor/new">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro flow
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockFlows.map((flow) => (
            <Card key={flow.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-2">{flow.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {flow.module}
                      </Badge>
                      <span className="text-xs">{flow.steps} etapas</span>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/editor/${flow.id}`}>Abrir</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(flow.id)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartilhar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{flow.lastUpdated}</span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/editor/${flow.id}`}>
                      Abrir
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Flow</DialogTitle>
            <DialogDescription>Usuários externos podem acessar o modo de teste através deste link</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link público</Label>
              <div className="flex gap-2">
                <Input value={publicUrl} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl)
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Qualquer pessoa com este link poderá visualizar e executar o fluxo de teste, adicionar comentários e
              anexar evidências.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
