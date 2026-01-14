"use client"

import React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Users, FileText, Workflow, Zap, Building2, Crown, Check } from "lucide-react"
import Link from "next/link"
import gsap from "gsap"

const flowScenarios = [
  {
    nodes: [
      { id: 1, label: "Login", icon: Users, color: "hsl(var(--chart-1))" },
      { id: 2, label: "Dashboard", icon: Building2, color: "hsl(var(--chart-3))" },
      { id: 3, label: "Recebimento", icon: Workflow, color: "hsl(var(--chart-4))" },
    ],
  },
  {
    nodes: [
      { id: 1, label: "Criar pedido", icon: FileText, color: "hsl(var(--primary))" },
      { id: 2, label: "Aprovar", icon: CheckCircle2, color: "hsl(var(--chart-2))" },
      { id: 3, label: "Executar", icon: Crown, color: "hsl(var(--chart-5))" },
    ],
  },
  {
    nodes: [
      { id: 1, label: "Upload arquivo", icon: FileText, color: "hsl(var(--chart-5))" },
      { id: 2, label: "Validar dados", icon: CheckCircle2, color: "hsl(var(--chart-2))" },
      { id: 3, label: "Confirmar", icon: Zap, color: "hsl(var(--primary))" },
    ],
  },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const flowContainerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentFlow, setCurrentFlow] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const dots: { x: number; y: number; vx: number; vy: number; size: number }[] = []
    const dotCount = 50

    for (let i = 0; i < dotCount; i++) {
      dots.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      // Update and draw dots
      dots.forEach((dot) => {
        dot.x += dot.vx
        dot.y += dot.vy

        if (dot.x < 0 || dot.x > canvas.offsetWidth) dot.vx *= -1
        if (dot.y < 0 || dot.y > canvas.offsetHeight) dot.vy *= -1

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(139, 92, 246, 0.3)"
        ctx.fill()
      })

      // Draw connections
      dots.forEach((dot1, i) => {
        dots.slice(i + 1).forEach((dot2) => {
          const dx = dot1.x - dot2.x
          const dy = dot1.y - dot2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(dot1.x, dot1.y)
            ctx.lineTo(dot2.x, dot2.y)
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - distance / 150)})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        })
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  useEffect(() => {
    // Hero animations
    if (heroRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".hero-title", {
          y: 50,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        })
        gsap.from(".hero-subtitle", {
          y: 30,
          opacity: 0,
          duration: 1,
          delay: 0.2,
          ease: "power3.out",
        })
        gsap.from(".hero-buttons", {
          y: 30,
          opacity: 0,
          duration: 1,
          delay: 0.4,
          ease: "power3.out",
        })
      }, heroRef)

      return () => ctx.revert()
    }
  }, [])

  useEffect(() => {
    if (flowContainerRef.current) {
      // Initial fade in
      gsap.fromTo(flowContainerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" })

      // Set interval to change flows
      const interval = setInterval(() => {
        if (flowContainerRef.current) {
          // Fade out
          gsap.to(flowContainerRef.current, {
            opacity: 0,
            duration: 0.4,
            ease: "power2.in",
            onComplete: () => {
              // Change flow
              setCurrentFlow((prev) => (prev + 1) % flowScenarios.length)
              // Fade in
              gsap.to(flowContainerRef.current, {
                opacity: 1,
                duration: 0.6,
                ease: "power2.out",
              })
            },
          })
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [])

  const currentScenario = flowScenarios[currentFlow]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Workflow className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">TestForge</span>
            </div>

            <nav className="hidden items-center gap-8 md:flex">
              <Link href="#produto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Produto
              </Link>
              <Link
                href="#como-funciona"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Como funciona
              </Link>
              <Link href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Preços
              </Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
            </nav>

            <Button asChild>
              <Link href="/register">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="hero-title text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
              Crie, execute e documente testes de forma visual
            </h1>
            <p className="hero-subtitle mt-6 text-lg leading-relaxed text-muted-foreground text-balance">
              A plataforma completa para equipes que querem parar de documentar testes em Word e começar a criar fluxos
              visuais colaborativos.
            </p>
            <div className="hero-buttons mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Criar meu primeiro flow
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#demo">Ver demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Visual Section */}
      <section id="demo" className="py-20 px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl relative">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />

            <div className="relative z-10 p-8 lg:p-12">
              <div
                ref={flowContainerRef}
                className="flex flex-col items-center gap-6 lg:flex-row lg:justify-center min-h-[200px]"
              >
                {currentScenario.nodes.map((node, index) => (
                  <div key={`${currentFlow}-${node.id}`} className="contents">
                    {/* Node */}
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="flex h-24 w-24 items-center justify-center rounded-xl border-2 shadow-lg transition-all"
                        style={{
                          borderColor: node.color,
                          backgroundColor: `${node.color}15`,
                          boxShadow: `0 0 20px ${node.color}30`,
                        }}
                      >
                        {React.createElement(node.icon, {
                          className: "h-10 w-10",
                          style: { color: node.color },
                        })}
                      </div>
                      <span className="text-sm font-medium">{node.label}</span>
                    </div>

                    {/* Connection line */}
                    {index < currentScenario.nodes.length - 1 && (
                      <div
                        className="h-0.5 w-16 lg:w-24 rounded-full"
                        style={{
                          backgroundColor: node.color,
                          boxShadow: `0 0 10px ${node.color}50`,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-8 text-center text-muted-foreground">
                Visualize seus cenários de teste como fluxos interativos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="produto" className="py-20 px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">Por que TestForge?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Tudo que você precisa para documentar e executar testes
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Workflow className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">Fluxos visuais</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Crie cenários de teste arrastando e conectando etapas de forma intuitiva
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                <Users className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="mt-4 font-semibold">Colaboração em tempo real</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Trabalhe em equipe, compartilhe feedbacks e revise testes juntos
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-4/10">
                <CheckCircle2 className="h-6 w-6 text-chart-4" />
              </div>
              <h3 className="mt-4 font-semibold">Evidências por etapa</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Anexe prints e comentários em cada etapa do seu fluxo de teste
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-1/10">
                <FileText className="h-6 w-6 text-chart-1" />
              </div>
              <h3 className="mt-4 font-semibold">Exportação fácil</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Exporte seus fluxos para PDF e Word com um clique
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="como-funciona" className="py-20 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">O que dizem nossos usuários</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-muted-foreground">
                "TestForge transformou a forma como documentamos nossos testes. Finalmente conseguimos ter visibilidade
                total dos cenários."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                  MC
                </div>
                <div>
                  <p className="text-sm font-medium">Maria Costa</p>
                  <p className="text-xs text-muted-foreground">QA Lead</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-muted-foreground">
                "A colaboração em tempo real economizou horas de reuniões. Agora toda a equipe sabe exatamente o que
                precisa ser testado."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-2/10 text-sm font-medium">
                  JS
                </div>
                <div>
                  <p className="text-sm font-medium">João Silva</p>
                  <p className="text-xs text-muted-foreground">Product Manager</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-muted-foreground">
                "Nunca foi tão fácil documentar evidências de teste. Os fluxos visuais facilitam muito o entendimento."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-4/10 text-sm font-medium">
                  AP
                </div>
                <div>
                  <p className="text-sm font-medium">Ana Paula</p>
                  <p className="text-xs text-muted-foreground">Test Analyst</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">Escolha o plano ideal para você</h2>
            <p className="mt-4 text-lg text-muted-foreground">Comece pequeno e escale conforme sua necessidade</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
            {/* Forge Start Plan */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-chart-3 mb-2">
                <Zap className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wide">Forge Start</span>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">R$ 79</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">ou R$ 790/ano</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Comece a documentar seus testes com evidência
              </p>

              <div className="mt-6 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ideal para</p>
                <ul className="space-y-1">
                  <li className="text-sm text-muted-foreground">• Startups</li>
                  <li className="text-sm text-muted-foreground">• Times pequenos</li>
                  <li className="text-sm text-muted-foreground">• Validação de processos</li>
                </ul>
              </div>

              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Até 3 usuários</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Até 10 Flows ativos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Editor visual de flows</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Templates básicos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Execução manual de testes</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Compartilhamento por link</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Histórico de execuções (7 dias)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Login com Email e Google</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Anexo de evidências por etapa</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">1 Space</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Até 200 evidências</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Retenção de evidências: 7 dias</span>
                </li>
              </ul>

              <Button className="w-full mt-8 bg-transparent" variant="outline" asChild>
                <Link href="/register">Começar agora</Link>
              </Button>
            </div>

            {/* Forge Team Plan - WITH ANIMATED BORDER */}
            <div className="relative rounded-2xl p-[3px] shadow-lg group">
              {/* Animated gradient border */}
              <div
                className="absolute inset-0 rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity"
                style={{
                  background:
                    "linear-gradient(90deg, hsl(var(--chart-5)), hsl(var(--primary)), hsl(var(--chart-2)), hsl(var(--chart-4)), hsl(var(--chart-5)))",
                  backgroundSize: "200% 200%",
                  animation: "rotate-border 3s ease infinite",
                }}
              />

              {/* Card content */}
              <div className="relative bg-card rounded-2xl p-8 h-full">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-medium">
                  Mais popular
                </div>

                <div className="flex items-center gap-2 text-primary mb-2">
                  <Building2 className="h-5 w-5" />
                  <span className="text-sm font-medium uppercase tracking-wide">Forge Team</span>
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold">R$ 249</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">ou R$ 2.490/ano</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Colaboração, automação e evidências organizadas
                </p>

                <div className="mt-6 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ideal para</p>
                  <ul className="space-y-1">
                    <li className="text-sm text-muted-foreground">• Times de QA estruturados</li>
                    <li className="text-sm text-muted-foreground">• Empresas com múltiplos projetos</li>
                    <li className="text-sm text-muted-foreground">• Times ágeis</li>
                  </ul>
                </div>

                <p className="mt-6 text-xs font-semibold text-primary">Tudo do Forge Start +</p>

                <ul className="mt-4 space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Até 10 usuários</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Flows ilimitados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Templates customizados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Execução automática (CI / agendada)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Versionamento de flows</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Permissões por usuário</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Tags, filtros e organização</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Histórico completo de execuções</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Relatórios exportáveis (PDF / CSV)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Evidências versionadas por execução</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Até 3 Spaces</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Até 500 evidências</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm">Retenção de evidências: 30 dias</span>
                  </li>
                </ul>

                <Button className="w-full mt-8" asChild>
                  <Link href="/register">Começar agora</Link>
                </Button>
              </div>
            </div>

            {/* Forge Enterprise Plan */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-chart-4 mb-2">
                <Crown className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wide">Forge Enterprise</span>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">Sob consulta</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Entre R$ 800 e R$ 2.000/mês</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Evidência, governança e compliance em escala
              </p>

              <div className="mt-6 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ideal para</p>
                <ul className="space-y-1">
                  <li className="text-sm text-muted-foreground">• Médias e grandes empresas</li>
                  <li className="text-sm text-muted-foreground">• Ambientes regulados</li>
                  <li className="text-sm text-muted-foreground">• Times multi-squad</li>
                </ul>
              </div>

              <p className="mt-6 text-xs font-semibold text-chart-4">Tudo do Forge Team +</p>

              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Usuários ilimitados</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Ambientes múltiplos (dev / staging / prod)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">SSO (SAML / Azure AD / Okta)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Auditoria completa (logs imutáveis)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">SLAs e suporte prioritário</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Onboarding assistido</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Templates corporativos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Permissões avançadas (RBAC)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">API completa</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Feature flags</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">White-label (opcional)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Retenção customizada de evidências</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Spaces ilimitados</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                  <span className="text-sm">2.000+ evidências</span>
                </li>
              </ul>

              <Button className="w-full mt-8 bg-transparent" variant="outline" asChild>
                <Link href="/register">Falar com vendas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Pare de documentar testes no Word</h2>
          <p className="mt-4 text-lg text-muted-foreground">Comece a criar fluxos visuais colaborativos hoje mesmo</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Começar gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Fazer login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Workflow className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">TestForge</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 TestForge. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
