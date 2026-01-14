"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Workflow, Loader2, Calendar, CreditCard, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { billingClient } from "@/lib"
import type { Subscription, Plan } from "@/lib"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

export default function BillingManagePage() {
    const router = useRouter()
    const { user, workspace, subscription: authSubscription, refreshSubscription, isLoading: authLoading } = useAuth()
    const [subscription, setSubscription] = useState<Subscription | null>(authSubscription)
    const [plans, setPlans] = useState<Plan[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const [isCanceling, setIsCanceling] = useState(false)
    const [isReactivating, setIsReactivating] = useState(false)

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login")
            } else if (!workspace) {
                router.push("/create-workspace")
            } else if (!authSubscription) {
                router.push("/subscribe")
            }
        }
    }, [user, workspace, authSubscription, authLoading, router])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [subsResponse, plansResponse] = await Promise.all([
                    billingClient.getSubscription(),
                    billingClient.getPlans(),
                ])

                if (subsResponse.success && subsResponse.data) {
                    setSubscription(subsResponse.data.subscription)
                }

                if (plansResponse.success && plansResponse.data) {
                    setPlans(plansResponse.data.plans)
                }
            } catch (error) {
                toast.error("Erro ao carregar dados")
            } finally {
                setIsLoading(false)
            }
        }

        if (user && workspace && authSubscription) {
            fetchData()
        }
    }, [user, workspace, authSubscription])

    const handleCancelSubscription = async () => {
        setIsCanceling(true)

        try {
            const response = await billingClient.cancelSubscription({ immediate: false })

            if (response.success) {
                toast.success("Assinatura será cancelada ao final do período atual")
                await refreshSubscription()
                setShowCancelDialog(false)

                // Refresh subscription data
                const subsResponse = await billingClient.getSubscription()
                if (subsResponse.success && subsResponse.data) {
                    setSubscription(subsResponse.data.subscription)
                }
            } else if (response.error) {
                toast.error(response.error.message || "Erro ao cancelar assinatura")
            }
        } catch (error) {
            toast.error("Erro ao cancelar assinatura")
        } finally {
            setIsCanceling(false)
        }
    }

    const handleReactivateSubscription = async () => {
        setIsReactivating(true)

        try {
            const response = await billingClient.reactivateSubscription()

            if (response.success) {
                toast.success("Assinatura reativada com sucesso!")
                await refreshSubscription()

                // Refresh subscription data
                const subsResponse = await billingClient.getSubscription()
                if (subsResponse.success && subsResponse.data) {
                    setSubscription(subsResponse.data.subscription)
                }
            } else if (response.error) {
                toast.error(response.error.message || "Erro ao reativar assinatura")
            }
        } catch (error) {
            toast.error("Erro ao reativar assinatura")
        } finally {
            setIsReactivating(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-chart-2">Ativo</Badge>
            case 'TRIALING':
                return <Badge className="bg-blue-500">Trial</Badge>
            case 'PAST_DUE':
                return <Badge variant="destructive">Pagamento Atrasado</Badge>
            case 'CANCELED':
                return <Badge variant="outline">Cancelado</Badge>
            case 'INCOMPLETE':
                return <Badge variant="outline">Incompleto</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    if (authLoading || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="inline-block h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
                </div>
            </div>
        )
    }

    if (!subscription) {
        return null
    }

    return (
        <div className="min-h-screen bg-background p-4 py-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                            <Workflow className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <span className="text-2xl font-semibold">TestForge</span>
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Gerenciar Assinatura</h1>
                    <p className="text-muted-foreground">
                        Gerencie seu plano e informações de cobrança
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* Current Plan */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Plano Atual</CardTitle>
                                    <CardDescription>Seu plano de assinatura ativo</CardDescription>
                                </div>
                                {getStatusBadge(subscription.status)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Plano</div>
                                    <div className="text-lg font-semibold">{subscription.plan.name}</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Ciclo de cobrança</div>
                                    <div className="text-lg font-semibold">
                                        {subscription.billingCycle === 'MONTHLY' ? 'Mensal' : 'Anual'}
                                    </div>
                                </div>
                            </div>

                            {subscription.cancelAtPeriodEnd && (
                                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Assinatura será cancelada
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Sua assinatura será cancelada em {formatDate(subscription.currentPeriodEnd)}.
                                            Você manterá acesso até esta data.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Billing Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Informações de Cobrança
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Início do período</div>
                                    <div className="font-medium">{formatDate(subscription.currentPeriodStart)}</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">
                                        {subscription.cancelAtPeriodEnd ? 'Cancela em' : 'Próxima cobrança'}
                                    </div>
                                    <div className="font-medium">{formatDate(subscription.currentPeriodEnd)}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CreditCard className="h-4 w-4" />
                                <span>ID do Cliente Stripe: {subscription.stripeCustomerId}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ações</CardTitle>
                            <CardDescription>Gerencie sua assinatura</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                onClick={() => router.push('/subscribe')}
                                variant="outline"
                                className="w-full justify-start"
                            >
                                Ver outros planos
                            </Button>

                            {subscription.cancelAtPeriodEnd ? (
                                <Button
                                    onClick={handleReactivateSubscription}
                                    variant="default"
                                    className="w-full justify-start"
                                    disabled={isReactivating}
                                >
                                    {isReactivating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Reativando...
                                        </>
                                    ) : (
                                        'Reativar assinatura'
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setShowCancelDialog(true)}
                                    variant="outline"
                                    className="w-full justify-start text-destructive hover:text-destructive"
                                >
                                    Cancelar assinatura
                                </Button>
                            )}

                            <Button
                                onClick={() => router.push('/dashboard')}
                                variant="ghost"
                                className="w-full justify-start"
                            >
                                Voltar ao Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancelar assinatura?</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja cancelar sua assinatura?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-sm text-foreground">
                                Sua assinatura será cancelada ao final do período atual em{' '}
                                <strong>{formatDate(subscription.currentPeriodEnd)}</strong>.
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Você manterá acesso a todos os recursos até esta data.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCancelDialog(false)}
                            disabled={isCanceling}
                        >
                            Manter assinatura
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelSubscription}
                            disabled={isCanceling}
                        >
                            {isCanceling ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cancelando...
                                </>
                            ) : (
                                'Confirmar cancelamento'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
