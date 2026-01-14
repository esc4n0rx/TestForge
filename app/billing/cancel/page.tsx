"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Workflow, XCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function BillingCancelPage() {
    const router = useRouter()
    const { hasActiveSubscription } = useAuth()

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
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <XCircle className="h-10 w-10 text-muted-foreground" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Pagamento cancelado</CardTitle>
                        <CardDescription>
                            Você cancelou o processo de pagamento
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Button
                                onClick={() => router.push('/subscribe')}
                                className="w-full"
                                size="lg"
                            >
                                Ver planos novamente
                            </Button>

                            {hasActiveSubscription && (
                                <Button
                                    onClick={() => router.push('/dashboard')}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Ir para o Dashboard
                                </Button>
                            )}

                            <Button
                                onClick={() => router.push('/')}
                                variant="ghost"
                                className="w-full"
                            >
                                Voltar ao início
                            </Button>
                        </div>

                        <div className="text-center text-xs text-muted-foreground">
                            <p>Precisa de ajuda?</p>
                            <Link href="#" className="text-primary hover:underline">
                                Entre em contato com o suporte
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
