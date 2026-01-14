"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Workflow } from "lucide-react"

const mockTemplates = [
  {
    id: "1",
    name: "Recebimento EWM",
    module: "EWM",
    steps: 8,
    description: "Template completo para processo de recebimento de mercadorias no EWM",
    uses: 45,
  },
  {
    id: "2",
    name: "Criação de Pedido MM",
    module: "MM",
    steps: 5,
    description: "Fluxo padrão para criação de pedido de compra no módulo MM",
    uses: 89,
  },
  {
    id: "3",
    name: "Ordem de Venda SD",
    module: "SD",
    steps: 12,
    description: "Processo completo de criação e processamento de ordem de venda",
    uses: 67,
  },
  {
    id: "4",
    name: "Aprovação de Requisição",
    module: "MM",
    steps: 6,
    description: "Fluxo de aprovação de requisição de compra com múltiplos níveis",
    uses: 34,
  },
]

export default function TemplatesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground mt-1">Use templates prontos para criar seus flows rapidamente</p>
        </div>
        <Button size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Criar Template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockTemplates.map((template) => (
          <Card key={template.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Workflow className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {template.module}
                </Badge>
              </div>
              <CardTitle className="mt-4">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {template.steps} etapas · {template.uses} usos
                </div>
                <Button size="sm" variant="outline">
                  Usar template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
