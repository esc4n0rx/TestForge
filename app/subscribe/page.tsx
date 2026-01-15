"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Workflow, Check, Loader2, Zap, Users, Rocket } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { billingClient } from "@/lib"
import type { Plan } from "@/lib"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function SubscribePage() {
    const router = useRouter()
    const { user, workspace, refreshSubscription, isLoading: authLoading } = useAuth()
    const [plans, setPlans] = useState<Plan[]>([])
    const [isLoadingPlans, setIsLoadingPlans] = useState(true)
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
    const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)

    // Redirect if not authenticated or no workspace
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login")
            } else if (!workspace) {
                router.push("/create-workspace")
            }
        }
    }, [user, workspace, authLoading, router])

    // Fetch plans
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await billingClient.getPlans()
                if (response.success && response.data) {
                    setPlans(response.data.plans)
                } else {
                    toast.error("Erro ao carregar planos")
                }
            } catch (error) {
                toast.error("Erro ao carregar planos")
            } finally {
                setIsLoadingPlans(false)
            }
        }

        if (user && workspace) {
            fetchPlans()
        }
    }, [user, workspace])

    const handleSelectPlan = (plan: Plan) => {
        setSelectedPlan(plan)
        setShowPaymentDialog(true)
    }

    const handleCreateSubscription = async () => {
        if (!selectedPlan) return

        setIsCreatingSubscription(true)

        try {
            const response = await billingClient.createSubscription({
                planId: selectedPlan.id,
                billingCycle,
                successUrl: `${window.location.origin}/billing/success`,
                cancelUrl: `${window.location.origin}/billing/cancel`,
            })

            if (response.success && response.data) {
                // Redirect to Stripe Checkout
                window.location.href = response.data.checkoutUrl
            } else if (response.error) {
                switch (response.error.code) {
                    case "NO_WORKSPACE":
                        toast.error("Você precisa criar um workspace primeiro")
                        router.push("/create-workspace")
                        break
                    case "SUBSCRIPTION_ALREADY_EXISTS":
                        toast.error("Você já possui uma assinatura ativa")
                        await refreshSubscription()
                        router.push("/dashboard")
                        break
                    case "PLAN_NOT_FOUND":
                        toast.error("Plano não encontrado")
                        break
                    case "ENTERPRISE_PLAN_CONTACT_REQUIRED":
                        toast.error("O plano Enterprise requer contato direto com nossa equipe comercial.")
                        break
                    case "UNAUTHORIZED":
                        toast.error("Sessão expirada. Faça login novamente.")
                        router.push("/login")
                        break
                    default:
                        toast.error(response.error.message || "Erro ao criar assinatura")
                }
            }
        } catch (error) {
            toast.error("Erro ao criar assinatura. Tente novamente.")
        } finally {
            setIsCreatingSubscription(false)
        }
    }

    const getPlanIcon = (type: string) => {
        switch (type) {
            case "START":
                return <Zap className="h-6 w-6" />
            case "PRO":
                return <Users className="h-6 w-6" />
            case "ENTERPRISE":
                return <Rocket className="h-6 w-6" />
            default:
                return <Zap className="h-6 w-6" />
        }
    }

    const getPrice = (plan: Plan) => {
        return billingCycle === "monthly"
            ? plan.pricing.monthly.formatted
            : plan.pricing.yearly.monthlyEquivalent
    }

    if (authLoading || isLoadingPlans) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4 py-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                            <Workflow className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <span className="text-2xl font-semibold">TestForge</span>
                    </Link>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Escolha seu plano</h1>
                    <p className="text-muted-foreground text-lg mb-8">
                        Selecione o plano ideal para sua equipe começar a criar fluxos de teste
                    </p>

                    {/* Billing Cycle Toggle */}
                    <div className="inline-flex items-center gap-3 p-1 bg-muted rounded-lg">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === "monthly"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === "yearly"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Anual
                            <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary border-0">
                                Economize 16%
                            </Badge>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`relative border-2 transition-all hover:shadow-xl ${plan.type === "PRO"
                                ? "border-primary shadow-lg scale-105"
                                : "border-border hover:border-primary/50"
                                }`}
                        >
                            {plan.type === "PRO" && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                                        Recomendado
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center pb-8">
                                <div className="flex justify-center mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        {getPlanIcon(plan.type)}
                                    </div>
                                </div>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription className="mt-2">{plan.description}</CardDescription>
                                <div className="mt-6">
                                    <div className="text-4xl font-bold">{getPrice(plan)}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {billingCycle === "monthly" ? "por mês" : "por mês (cobrado anualmente)"}
                                    </div>
                                    {billingCycle === "yearly" && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {plan.pricing.yearly.formatted} por ano
                                        </div>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">{feature.name}</div>
                                                {feature.description && (
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {feature.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => handleSelectPlan(plan)}
                                    className="w-full"
                                    variant={plan.type === "PRO" ? "default" : "outline"}
                                    size="lg"
                                >
                                    Selecionar {plan.name}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        Passo 2 de 2 • Após escolher o plano, você terá acesso completo ao dashboard
                    </p>
                </div>
            </div>

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar assinatura</DialogTitle>
                        <DialogDescription>
                            Você está prestes a assinar o plano {selectedPlan?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{selectedPlan?.name}</span>
                                <span className="text-lg font-bold">
                                    {selectedPlan && getPrice(selectedPlan)}
                                </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Cobrança {billingCycle === "monthly" ? "mensal" : "anual"}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Ao continuar, você será redirecionado para uma página segura de pagamento,
                                onde a transação será processada pelo Stripe.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowPaymentDialog(false)}
                                className="flex-1"
                                disabled={isCreatingSubscription}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCreateSubscription}
                                className="flex-1"
                                disabled={isCreatingSubscription}
                            >
                                {isCreatingSubscription ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    "Confirmar assinatura"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
