"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, MoreVertical, Mail } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mockTeamMembers = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@empresa.com",
    role: "Admin",
    initials: "JS",
    joinedAt: "Jan 2026",
  },
  {
    id: "2",
    name: "Maria Costa",
    email: "maria@empresa.com",
    role: "Editor",
    initials: "MC",
    joinedAt: "Jan 2026",
  },
  {
    id: "3",
    name: "Ana Paula",
    email: "ana@empresa.com",
    role: "Editor",
    initials: "AP",
    joinedAt: "Fev 2026",
  },
  {
    id: "4",
    name: "Pedro Santos",
    email: "pedro@empresa.com",
    role: "Visualizador",
    initials: "PS",
    joinedAt: "Fev 2026",
  },
]

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("editor")

  const handleInvite = () => {
    // Mock invite
    setInviteOpen(false)
    setInviteEmail("")
    setInviteRole("editor")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipe</h1>
          <p className="text-muted-foreground mt-1">Gerencie os membros da sua equipe</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <UserPlus className="mr-2 h-5 w-5" />
              Convidar membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar membro para equipe</DialogTitle>
              <DialogDescription>Envie um convite por email para adicionar um novo membro</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="email@empresa.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Papel</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {inviteRole === "admin" && "Acesso total ao sistema incluindo gerenciar membros"}
                  {inviteRole === "editor" && "Pode criar e editar flows"}
                  {inviteRole === "viewer" && "Pode apenas visualizar flows"}
                </p>
              </div>
              <Button onClick={handleInvite} className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Enviar convite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros ({mockTeamMembers.length})</CardTitle>
          <CardDescription>Pessoas com acesso ao TestFlow da sua organização</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTeamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">{member.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{member.role}</Badge>
                  <span className="text-sm text-muted-foreground">{member.joinedAt}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Alterar papel</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Remover</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Papéis e Permissões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge>Admin</Badge>
                <span className="text-sm">Acesso total</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pode gerenciar membros, flows, templates e configurações da equipe
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Editor</Badge>
                <span className="text-sm">Criar e editar</span>
              </div>
              <p className="text-sm text-muted-foreground">Pode criar, editar e executar flows de teste</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Visualizador</Badge>
                <span className="text-sm">Somente leitura</span>
              </div>
              <p className="text-sm text-muted-foreground">Pode visualizar flows e adicionar comentários</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
