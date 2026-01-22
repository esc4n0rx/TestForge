"use client"

import React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Users, FileText, Workflow, Zap, Building2, Crown, Check, PlayCircle, CheckSquare, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import gsap from "gsap"
import { FlowCard } from "@/components/landing/flow-card"
import type { Node, Edge } from "@xyflow/react"
import { MarkerType } from "@xyflow/react"
import { LogoText } from "@/components/ui/logo-text"

const flowScenarios: Array<{ nodes: Node[]; edges: Edge[] }> = [
  {
    nodes: [
      {
        id: "1",
        type: "default",
        position: { x: 50, y: 80 },
        data: { label: "🔐 Login" },
        style: {
          background: "linear-gradient(135deg, hsl(40 70% 60% / 0.3), hsl(40 70% 50% / 0.2))",
          border: "2px solid hsl(40 70% 55%)",
          borderRadius: "12px",
          padding: "16px 24px",
          fontSize: "14px",
          fontWeight: "600",
          color: "hsl(var(--foreground))",
          boxShadow: "0 0 30px hsl(40 70% 55% / 0.4), 0 4px 12px rgba(0,0,0,0.3)",
        },
      },
      {
        id: "2",
        type: "default",
        position: { x: 250, y: 80 },
        data: { label: "📊 Dashboard" },
        style: {
          background: "linear-gradient(135deg, hsl(220 70% 60% / 0.3), hsl(220 70% 50% / 0.2))",
          border: "2px solid hsl(220 70% 55%)",
          borderRadius: "12px",
          padding: "16px 24px",
          fontSize: "14px",
          fontWeight: "600",
          color: "hsl(var(--foreground))",
          boxShadow: "0 0 30px hsl(220 70% 55% / 0.4), 0 4px 12px rgba(0,0,0,0.3)",
        },
      },
      {
        id: "3",
        type: "default",
        position: { x: 450, y: 80 },
        data: { label: "✅ Validar" },
        style: {
          background: "linear-gradient(135deg, hsl(310 70% 60% / 0.3), hsl(310 70% 50% / 0.2))",
          border: "2px solid hsl(310 70% 55%)",
          borderRadius: "12px",
          padding: "16px 24px",
          fontSize: "14px",
          fontWeight: "600",
          color: "hsl(var(--foreground))",
          boxShadow: "0 0 30px hsl(310 70% 55% / 0.4), 0 4px 12px rgba(0,0,0,0.3)",
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        animated: true,
        style: { stroke: "hsl(40 70% 55%)", strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(40 70% 55%)" },
      },
      {
        id: "e2-3",
        source: "2",
        target: "3",
        animated: true,
        style: { stroke: "hsl(220 70% 55%)", strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(220 70% 55%)" },
      },
    ],
  },
  {
    nodes: [
      {
        id: "1",
        type: "default",
        position: { x: 50, y: 80 },
        data: { label: "📝 Criar Pedido" },
        style: {
          background: "linear-gradient(135deg, hsl(265 70% 65% / 0.3), hsl(265 70% 55% / 0.2))",
          border: "2px solid hsl(265 70% 60%)",
          borderRadius: "12px",
          padding: "16px 24px",
          fontSize: "14px",
          fontWeight: "600",
          color: "hsl(var(--foreground))",
          boxShadow: "0 0 30px hsl(265 70% 60% / 0.4), 0 4px 12px rgba(0,0,0,0.3)",
        },
      },
      {
        id: "2",
        type: "default",
        position: { x: 250, y: 80 },
        data: { label: "✓ Aprovar" },
        style: {
          background: "linear-gradient(135deg, hsl(180 70% 55% / 0.3), hsl(180 70% 45% / 0.2))",
          border: "2px solid hsl(180 70% 50%)",
          borderRadius: "12px",
          padding: "16px 24px",
          fontSize: "14px",
          fontWeight: "600",
          color: "hsl(var(--foreground))",
          boxShadow: "0 0 30px hsl(180 70% 50% / 0.4), 0 4px 12px rgba(0,0,0,0.3)",
        },
      },
      {
        id: "3",
        type: "default",
        position: { x: 450, y: 80 },
        data: { label: "⚡ Executar" },
        style: {
          background: "linear-gradient(135deg, hsl(70 70% 55% / 0.3), hsl(70 70% 45% / 0.2))",
          border: "2px solid hsl(70 70% 50%)",
          borderRadius: "12px",
          padding: "16px 24px",
          fontSize: "14px",
          fontWeight: "600",
          color: "hsl(var(--foreground))",
          boxShadow: "0 0 30px hsl(70 70% 50% / 0.4), 0 4px 12px rgba(0,0,0,0.3)",
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        animated: true,
        style: { stroke: "hsl(265 70% 60%)", strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(265 70% 60%)" },
      },
      {
        id: "e2-3",
        source: "2",
        target: "3",
        animated: true,
        style: { stroke: "hsl(180 70% 50%)", strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(180 70% 50%)" },
      },
    ],
  },
  {
    nodes: [
      {
        id: "1",
        type: "default",
        position: { x: 50, y: 80 },
        data: { label: "📤 Upload" },
        style: {
          background: "linear-gradient(135deg, hsl(330 75% 60% / 0.3), hsl(330 75% 50% / 0.2))",
          border: "2px solid hsl(330 75% 55%)",
          borderRadius: "12px",
          padding: "16px 24px",
          fontSize: "14px",
          fontWeight: "600",
          color: "hsl(var(--foreground))",
          boxShadow: "0 0 30px hsl(330 75% 55% / 0.4), 0 4px 12px rgba(0,0,0,0.3)",
        },
      },
      {
        id: "2",
        type: "default",
        position: { x: 250, y: 80 },
        data: { label: "🔍 Validar" },
        style: {
          background: "linear-gradient(135deg, hsl(180 70% 55% / 0.3), hsl(180 70% 45% / 0.2))",
          border: "2px solid hsl(180 70% 50%)",
          borderRadius: "12px",
          padding: "16px 24px",
          fontSize: "14px",
          fontWeight: "600",
          color: "hsl(var(--foreground))",
          boxShadow: "0 0 30px hsl(180 70% 50% / 0.4), 0 4px 12px rgba(0,0,0,0.3)",
        },
      },
      {
        id: "3",
        type: "default",
        position: { x: 450, y: 80 },
        data: { label: "✅ Confirmar" },
        style: {
          background: "linear-gradient(135deg, hsl(265 70% 65% / 0.3), hsl(265 70% 55% / 0.2))",
          border: "2px solid hsl(265 70% 60%)",
          borderRadius: "12px",
          padding: "16px 24px",
          fontSize: "14px",
          fontWeight: "600",
          color: "hsl(var(--foreground))",
          boxShadow: "0 0 30px hsl(265 70% 60% / 0.4), 0 4px 12px rgba(0,0,0,0.3)",
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        animated: true,
        style: { stroke: "hsl(330 75% 55%)", strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(330 75% 55%)" },
      },
      {
        id: "e2-3",
        source: "2",
        target: "3",
        animated: true,
        style: { stroke: "hsl(180 70% 50%)", strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(180 70% 50%)" },
      },
    ],
  },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const flowContainerRef = useRef<HTMLDivElement>(null)
  const [currentFlow, setCurrentFlow] = useState(0)

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
            <Link href="/" className="flex items-center">
              <LogoText size="lg" />
            </Link>

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
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold sm:text-4xl">Visualize seus fluxos de teste</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Crie cenários de teste interativos e visuais com nossa plataforma
            </p>
          </div>

          <div
            ref={flowContainerRef}
            className="rounded-2xl border-2 border-border/50 bg-gradient-to-br from-card/50 to-card backdrop-blur-xl overflow-hidden shadow-2xl relative"
            style={{
              background: "linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.95) 100%)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-4/5 pointer-events-none" />

            <div className="relative z-10 p-8 lg:p-12">
              <FlowCard
                nodes={currentScenario.nodes}
                edges={currentScenario.edges}
                className="h-[300px] rounded-xl border border-border/30 bg-background/50 backdrop-blur-sm shadow-inner"
              />
              <div className="mt-6 flex items-center justify-center gap-2">
                {flowScenarios.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFlow(index)}
                    className={`h-2 rounded-full transition-all ${index === currentFlow
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    aria-label={`Ver flow ${index + 1}`}
                  />
                ))}
              </div>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                ✨ Fluxos interativos com conexões animadas e evidências por etapa
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

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">Como funciona</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Simplifique seu processo de testes em 4 passos simples
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-chart-4 rounded-2xl blur opacity-25 group-hover:opacity-50 transition"></div>
              <div className="relative rounded-xl border border-border bg-card p-6 shadow-sm h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <PlayCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute top-6 right-6 text-5xl font-bold text-primary/10">1</div>
                <h3 className="font-semibold text-lg mb-2">Crie seu flow</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Use o editor visual para criar cenários de teste arrastando e conectando etapas
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-chart-2 to-chart-5 rounded-2xl blur opacity-25 group-hover:opacity-50 transition"></div>
              <div className="relative rounded-xl border border-border bg-card p-6 shadow-sm h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10 mb-4">
                  <Users className="h-6 w-6 text-chart-2" />
                </div>
                <div className="absolute top-6 right-6 text-5xl font-bold text-chart-2/10">2</div>
                <h3 className="font-semibold text-lg mb-2">Compartilhe</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Convide sua equipe e clientes para colaborar em tempo real nos testes
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-chart-4 to-primary rounded-2xl blur opacity-25 group-hover:opacity-50 transition"></div>
              <div className="relative rounded-xl border border-border bg-card p-6 shadow-sm h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-4/10 mb-4">
                  <CheckSquare className="h-6 w-6 text-chart-4" />
                </div>
                <div className="absolute top-6 right-6 text-5xl font-bold text-chart-4/10">3</div>
                <h3 className="font-semibold text-lg mb-2">Execute testes</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Execute os testes passo a passo, anexando evidências e observações
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-chart-5 to-chart-1 rounded-2xl blur opacity-25 group-hover:opacity-50 transition"></div>
              <div className="relative rounded-xl border border-border bg-card p-6 shadow-sm h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-1/10 mb-4">
                  <FileText className="h-6 w-6 text-chart-1" />
                </div>
                <div className="absolute top-6 right-6 text-5xl font-bold text-chart-1/10">4</div>
                <h3 className="font-semibold text-lg mb-2">Exporte relatórios</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Gere relatórios profissionais em PDF ou Word com um clique
                </p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold">O que dizem nossos usuários</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
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

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
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

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
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
            <div className="relative rounded-2xl p-[4px] shadow-2xl group">
              {/* Animated gradient border */}
              <div
                className="absolute inset-0 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"
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
            <LogoText size="md" />
            <p className="text-sm text-muted-foreground">© 2026 TestForge. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
