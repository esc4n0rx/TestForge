"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, TestTube2 } from "lucide-react"
import { clientAuthClient } from "@/lib"
import { toast } from "sonner"

export default function ClientLoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        email: "",
        senha: "",
        workspaceSlug: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const response = await clientAuthClient.login(formData)

            if (response.success) {
                toast.success("Login realizado com sucesso!")
                router.push("/client/flows")
            } else {
                const errorMessage = response.error?.message || "Erro ao fazer login"
                setError(errorMessage)
                toast.error(errorMessage)
            }
        } catch (err) {
            const errorMessage = "Erro ao conectar com o servidor"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo/Branding */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                            <TestTube2 className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Portal do Cliente</h1>
                    <p className="text-muted-foreground">Acesse seus flows de teste</p>
                </div>

                {/* Login Card */}
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle>Entrar</CardTitle>
                        <CardDescription>Digite suas credenciais para acessar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="senha">Senha</Label>
                                <Input
                                    id="senha"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.senha}
                                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="workspace">Workspace</Label>
                                <Input
                                    id="workspace"
                                    type="text"
                                    placeholder="nome-da-empresa"
                                    value={formData.workspaceSlug}
                                    onChange={(e) => setFormData({ ...formData, workspaceSlug: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    autoComplete="organization"
                                />
                                <p className="text-xs text-muted-foreground">
                                    O identificador único do workspace fornecido pela empresa
                                </p>
                            </div>

                            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    "Entrar"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Rate Limit Warning */}
                <Card className="border-amber-500/50 bg-amber-500/10">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-amber-900 dark:text-amber-100">
                                    Limite de tentativas
                                </p>
                                <p className="text-amber-800 dark:text-amber-200 mt-1">
                                    Por segurança, você tem até 5 tentativas de login a cada 15 minutos.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground">
                    <p>Powered by TestForge</p>
                </div>
            </div>
        </div>
    )
}
