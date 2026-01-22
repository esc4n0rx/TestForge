"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Workflow, Users, Settings, LayoutTemplate, HardDrive, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { LogoText } from "@/components/ui/logo-text"

const navigation = [
  { name: "Flows", href: "/dashboard", icon: Workflow },
  { name: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
  { name: "Análise de Execuções", href: "/dashboard/flow-analysis", icon: BarChart3 },
  { name: "Spaces", href: "/dashboard/spaces", icon: HardDrive },
  { name: "Equipe", href: "/dashboard/team", icon: Users },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <LogoText size="md" />
      </div>

      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
