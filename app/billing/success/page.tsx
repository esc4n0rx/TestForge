"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Workflow, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { billingClient } from "@/lib"
import type { Subscription } from "@/lib"

function BillingSuccessContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const sessionId = searchParams.get("session_id")
    const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading')
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [retryCount, setRetryCount] = useState(0)

    useEffect(() => {
        if (!sessionId) {
            setStatus('error')
            return
        }

        const checkSubscription = async () => {
            try {
                // Wait a bit for webhook to process
                await new Promise(resolve => setTimeout(resolve, 2000))

                const response = await billingClient.getSubscription()

                if (response.success && response.data?.subscription) {
                    const sub = response.data.subscription
                    setSubscription(sub)

                    if (sub.status === 'ACTIVE' || sub.status === 'TRIALING') {
                        setStatus('success')
                    } else {
                        // Webhook hasn't processed yet
                        setStatus('pending')
                    }
                } else {
                    // No subscription found yet
                    setStatus('pending')
                }
            } catch (error) {
                setStatus('error')
            }
        }

        checkSubscription()
    }, [sessionId, retryCount])

    const handleRetry = () => {
        setStatus('loading')
        setRetryCount(prev => prev + 1)
    }

    const handleGoToDashboard = () => {
        router.push('/dashboard')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                            <Workflow className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <span className="text-2xl font-semibold">TestForge</span>
                    </Link>
                </div>

                <Card className="border-border shadow-2xl">
                    <CardHeader className="text-center">
                        {status === 'loading' && (
                            <>
                                <div className="flex justify-center mb-4">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                </div>
                                <CardTitle className="text-2xl">Processando pagamento...</CardTitle>
                                <CardDescription>
                                    Aguarde enquanto confirmamos seu pagamento
                                </CardDescription>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <div className="flex justify-center mb-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chart-2/10">
                                        <CheckCircle2 className="h-10 w-10 text-chart-2" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl">Pagamento confirmado!</CardTitle>
                                <CardDescription>
                                    Sua assinatura está ativa e pronta para uso
                                </CardDescription>
                            </>
                        )}

                        {status === 'pending' && (
                            <>
                                <div className="flex justify-center mb-4">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                </div>
                                <CardTitle className="text-2xl">Processando...</CardTitle>
                                <CardDescription>
                                    Seu pagamento está sendo processado. Isso pode levar alguns segundos.
                                </CardDescription>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <div className="flex justify-center mb-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                                        <AlertCircle className="h-10 w-10 text-destructive" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl">Erro ao processar</CardTitle>
                                <CardDescription>
                                    Não foi possível confirmar seu pagamento
                                </CardDescription>
                            </>
                        )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {status === 'success' && subscription && (
                            <>
                                <div className="rounded-lg bg-muted p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Plano:</span>
                                        <span className="font-medium">{subscription.plan.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Ciclo:</span>
                                        <span className="font-medium">
                                            {subscription.billingCycle === 'MONTHLY' ? 'Mensal' : 'Anual'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Status:</span>
                                        <span className="font-medium text-chart-2">Ativo</span>
                                    </div>
                                </div>

                                <Button onClick={handleGoToDashboard} className="w-full" size="lg">
                                    Ir para o Dashboard
                                </Button>
                            </>
                        )}

                        {status === 'pending' && (
                            <>
                                <div className="rounded-lg bg-muted p-4">
                                    <p className="text-sm text-muted-foreground text-center">
                                        Estamos aguardando a confirmação do pagamento.
                                        Isso normalmente leva apenas alguns segundos.
                                    </p>
                                </div>

                                <Button onClick={handleRetry} variant="outline" className="w-full">
                                    Verificar novamente
                                </Button>

                                <Button onClick={handleGoToDashboard} variant="ghost" className="w-full">
                                    Ir para o Dashboard
                                </Button>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                                    <p className="text-sm text-foreground">
                                        Houve um problema ao confirmar seu pagamento.
                                        Se você foi cobrado, entre em contato com o suporte.
                                    </p>
                                </div>

                                <Button onClick={handleRetry} variant="outline" className="w-full">
                                    Tentar novamente
                                </Button>

                                <Button onClick={() => router.push('/subscribe')} variant="ghost" className="w-full">
                                    Voltar aos planos
                                </Button>
                            </>
                        )}

                        {status === 'loading' && (
                            <div className="text-center text-sm text-muted-foreground">
                                Por favor, não feche esta página
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function BillingSuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <BillingSuccessContent />
        </Suspense>
    )
}
