"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Workflow, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import {
  flowsClient,
  type FlowWithDetails,
  canCreateTemplate,
  getMaxTemplatesDisplay,
  getFlowCards,
} from "@/lib"

export default function TemplatesPage() {
  const router = useRouter()
  const { subscription, workspace } = useAuth()
  const [templates, setTemplates] = useState<FlowWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState<number | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await flowsClient.listFlows({ isTemplate: true })

      if (response.success && response.data) {
        setTemplates(response.data.flows)
      } else {
        toast.error(response.error?.message || "Erro ao carregar templates")
      }
    } catch (error) {
      toast.error("Erro ao carregar templates")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    if (!workspace || !subscription) {
      toast.error("Workspace ou assinatura não encontrados")
      return
    }

    const currentTemplateCount = templates.length
    const planCode = subscription.plan.code

    if (!canCreateTemplate(currentTemplateCount, planCode)) {
      const maxTemplates = getMaxTemplatesDisplay(planCode)
      toast.error(`Limite de ${maxTemplates} templates atingido. Faça upgrade do plano.`)
      return
    }

    router.push("/dashboard/editor/new?isTemplate=true")
  }

  const handleUseTemplate = async (templateId: number) => {
    setIsCreatingFromTemplate(templateId)
    try {
      const response = await flowsClient.createFlowFromTemplate(templateId)

      if (response.success && response.data) {
        toast.success("Flow criado a partir do template")
        // Navigate to the editor with the created flow
        router.push(`/dashboard/editor/${response.data.flow.id}?fromTemplate=true`)
      } else {
        toast.error(response.error?.message || "Erro ao criar flow do template")
      }
    } catch (error) {
      toast.error("Erro ao criar flow do template")
    } finally {
      setIsCreatingFromTemplate(null)
    }
  }

  const getFlowTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TEST: "Teste",
      PROGRAM_FLOW: "Programa",
      PROCESS: "Processo",
    }
    return labels[type] || type
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Templates</h1>
            <p className="text-muted-foreground mt-1">Use templates prontos para criar seus flows rapidamente</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-6 w-3/4 mt-4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const currentTemplateCount = templates.length
  const maxTemplates = subscription ? getMaxTemplatesDisplay(subscription.plan.code) : "5"
  const canCreate = subscription && workspace && canCreateTemplate(currentTemplateCount, subscription.plan.code)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Use templates prontos para criar seus flows rapidamente
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTemplateCount} / {maxTemplates} templates criados
          </p>
        </div>
        <Button size="lg" onClick={handleCreateTemplate} disabled={!canCreate}>
          <Plus className="mr-2 h-5 w-5" />
          Criar Template
        </Button>
      </div>

      {!canCreate && subscription && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium">Limite de templates atingido</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Você atingiu o limite de {maxTemplates} templates do plano {subscription.plan.name}.
                  Faça upgrade para criar templates ilimitados.
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Ver Planos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Workflow className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhum template criado</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              Crie templates reutilizáveis para agilizar a criação de novos flows
            </p>
            <Button onClick={handleCreateTemplate} disabled={!canCreate} className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Criar primeiro template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Workflow className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {getFlowTypeLabel(template.type)}
                  </Badge>
                </div>
                <CardTitle className="mt-4 line-clamp-2">{template.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description || "Sem descrição"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {getFlowCards(template).length} cards · v{template.versionCount}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUseTemplate(template.id)}
                    disabled={isCreatingFromTemplate === template.id}
                  >
                    {isCreatingFromTemplate === template.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Usar template"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
