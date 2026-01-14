"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Workflow, Mail, Lock, User, Building2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const { register, hasWorkspace, hasActiveSubscription } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [company, setCompany] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres")
      return
    }

    if (name.length < 2) {
      toast.error("O nome deve ter no mínimo 2 caracteres")
      return
    }

    if (company.length < 2) {
      toast.error("O nome da empresa deve ter no mínimo 2 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const success = await register({
        email,
        nome: name,
        senha: password,
        empresa: company,
      })

      if (success) {
        // Wait a bit for auth context to update
        setTimeout(() => {
          if (!hasWorkspace) {
            router.push("/create-workspace")
          } else if (!hasActiveSubscription) {
            router.push("/subscribe")
          } else {
            router.push("/dashboard")
          }
        }, 100)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    // TODO: Implement Google OAuth
    alert("Cadastro com Google será implementado em breve")
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
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Criar conta</CardTitle>
            <CardDescription>Comece a criar seus fluxos de teste hoje</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="João Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    minLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="company"
                    type="text"
                    placeholder="Nome da empresa"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    minLength={2}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>

            <Button variant="outline" className="w-full bg-transparent" onClick={handleGoogleSignup} disabled={isLoading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Cadastrar com Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Fazer login
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao criar uma conta, você concorda com nossos{" "}
          <Link href="#" className="underline hover:text-foreground">
            Termos de Serviço
          </Link>{" "}
          e{" "}
          <Link href="#" className="underline hover:text-foreground">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  )
}
