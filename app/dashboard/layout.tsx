"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardTopbar } from "@/components/dashboard-topbar"
import { useAuth } from "@/hooks/use-auth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, hasWorkspace, hasActiveSubscription, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (!hasWorkspace) {
        router.push("/create-workspace")
      } else if (!hasActiveSubscription) {
        router.push("/subscribe")
      }
    }
  }, [isAuthenticated, hasWorkspace, hasActiveSubscription, isLoading, router])

  // Show nothing while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated, no workspace, or no active subscription
  if (!isAuthenticated || !hasWorkspace || !hasActiveSubscription) {
    return null
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col pl-64">
        <DashboardTopbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
