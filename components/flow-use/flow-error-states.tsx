"use client"

import { AlertCircle, Clock, ShieldOff, XCircle, WifiOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ErrorStateProps {
    onRetry?: () => void
}

export function SessionNotFound({ onRetry }: ErrorStateProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle>Sessão Não Encontrada</CardTitle>
                    <CardDescription>
                        O link de acesso fornecido é inválido ou não existe
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Verifique se o link foi copiado corretamente ou entre em contato com quem compartilhou este flow.
                        </AlertDescription>
                    </Alert>
                    {onRetry && (
                        <Button onClick={onRetry} className="w-full">
                            Tentar Novamente
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export function SessionExpired({ onRetry }: ErrorStateProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle>Sessão Expirada</CardTitle>
                    <CardDescription>
                        Este link de acesso expirou e não pode mais ser utilizado
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Solicite um novo link de acesso para continuar executando este flow.
                        </AlertDescription>
                    </Alert>
                    {onRetry && (
                        <Button onClick={onRetry} variant="outline" className="w-full">
                            Verificar Novamente
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export function SessionRevoked({ onRetry }: ErrorStateProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <ShieldOff className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle>Acesso Revogado</CardTitle>
                    <CardDescription>
                        O acesso a este flow foi revogado pelo administrador
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Entre em contato com o administrador do workspace para mais informações.
                        </AlertDescription>
                    </Alert>
                    {onRetry && (
                        <Button onClick={onRetry} variant="outline" className="w-full">
                            Verificar Novamente
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export function FlowNotActive({ onRetry }: ErrorStateProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <CardTitle>Flow Indisponível</CardTitle>
                    <CardDescription>
                        Este flow não está mais ativo ou disponível para execução
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            O flow pode ter sido desativado ou removido. Entre em contato com o administrador.
                        </AlertDescription>
                    </Alert>
                    {onRetry && (
                        <Button onClick={onRetry} variant="outline" className="w-full">
                            Verificar Novamente
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export function NetworkError({ onRetry }: ErrorStateProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <WifiOff className="h-6 w-6 text-gray-600" />
                    </div>
                    <CardTitle>Erro de Conexão</CardTitle>
                    <CardDescription>
                        Não foi possível conectar ao servidor
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Verifique sua conexão com a internet e tente novamente.
                        </AlertDescription>
                    </Alert>
                    {onRetry && (
                        <Button onClick={onRetry} className="w-full">
                            Tentar Novamente
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

interface GenericErrorProps extends ErrorStateProps {
    title?: string
    message?: string
}

export function GenericError({ title = "Erro", message = "Ocorreu um erro inesperado", onRetry }: GenericErrorProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent>
                    {onRetry && (
                        <Button onClick={onRetry} className="w-full">
                            Tentar Novamente
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
