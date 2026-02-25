"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { clientClient } from "@/lib/api/client/client-client"
import type {
  Client,
  ClientGroupDetail,
  ClientGroupSummary,
  ClientPortalRole,
} from "@/lib/types/client"
import { Building2, FolderTree, Loader2, Plus, RefreshCw, Save, Trash2, UserCog, Users } from "lucide-react"
import { toast } from "sonner"

interface ClientGroupsManagementProps {
  workspaceId: number
  clients: Client[]
  onClientsChanged: () => Promise<void> | void
}

const ROLE_OPTIONS: ClientPortalRole[] = ["VIEWER", "TESTER", "GROUP_ADMIN"]

const ROLE_LABEL: Record<ClientPortalRole, string> = {
  VIEWER: "Viewer",
  TESTER: "Tester",
  GROUP_ADMIN: "Admin do Grupo",
}

function getRoleBadgeVariant(role: ClientPortalRole | null | undefined) {
  if (role === "GROUP_ADMIN") return "default" as const
  if (role === "TESTER") return "secondary" as const
  return "outline" as const
}

function buildFallbackGroups(clients: Client[]): ClientGroupSummary[] {
  const explicitGroups = new Map<number, ClientGroupSummary>()

  for (const client of clients) {
    if (client.clientGroup?.id && !explicitGroups.has(client.clientGroup.id)) {
      explicitGroups.set(client.clientGroup.id, {
        id: client.clientGroup.id,
        workspaceId: client.workspaceMemberships?.[0]?.workspaceId ?? 0,
        name: client.clientGroup.name,
        isDefault: Boolean(client.clientGroup.isDefault),
        _count: { members: 0 },
      })
    }
  }

  if (explicitGroups.size === 0) {
    return [
      {
        id: -1,
        workspaceId: clients[0]?.workspaceMemberships?.[0]?.workspaceId ?? 0,
        name: "Grupo padrão (mock)",
        isDefault: true,
        _count: { members: clients.length },
      },
    ]
  }

  const counts = new Map<number, number>()
  for (const client of clients) {
    if (client.clientGroupId) {
      counts.set(client.clientGroupId, (counts.get(client.clientGroupId) || 0) + 1)
    } else if (client.clientGroup?.id) {
      counts.set(client.clientGroup.id, (counts.get(client.clientGroup.id) || 0) + 1)
    }
  }

  return Array.from(explicitGroups.values()).map((group) => ({
    ...group,
    _count: { members: counts.get(group.id) || 0 },
  }))
}

function buildFallbackGroupDetail(group: ClientGroupSummary, clients: Client[]): ClientGroupDetail {
  const members = clients.filter((client) => {
    const clientGroupId = client.clientGroupId ?? client.clientGroup?.id ?? (group.id === -1 ? -1 : null)
    return clientGroupId === group.id
  })

  return {
    ...group,
    members: members.map((client) => ({
      ...client,
      clientPortalRole: client.clientPortalRole ?? "TESTER",
    })),
  }
}

export function ClientGroupsManagement({
  workspaceId,
  clients,
  onClientsChanged,
}: ClientGroupsManagementProps) {
  const [groups, setGroups] = useState<ClientGroupSummary[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<ClientGroupDetail | null>(null)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loadingGroupDetail, setLoadingGroupDetail] = useState(false)

  const [newGroupName, setNewGroupName] = useState("")
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [editingGroupName, setEditingGroupName] = useState("")
  const [isSavingGroupName, setIsSavingGroupName] = useState(false)
  const [isEnsuringDefault, setIsEnsuringDefault] = useState(false)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)

  const [assignClientId, setAssignClientId] = useState<string>("")
  const [assignGroupId, setAssignGroupId] = useState<string>("")
  const [assignRole, setAssignRole] = useState<ClientPortalRole>("TESTER")
  const [isAssigning, setIsAssigning] = useState(false)

  const [memberRoleDrafts, setMemberRoleDrafts] = useState<Record<number, ClientPortalRole>>({})
  const [updatingMemberId, setUpdatingMemberId] = useState<number | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null)

  const clientsWithoutGroup = useMemo(() => {
    return clients.filter((client) => !client.clientGroupId && !client.clientGroup?.id)
  }, [clients])

  const refreshGroups = async (nextSelectedGroupId?: number | null) => {
    setLoadingGroups(true)

    try {
      const response = await clientClient.getClientGroups(workspaceId)

      if (response.success && response.data?.groups) {
        const nextGroups = response.data.groups
        setGroups(nextGroups)

        const preferredId =
          nextSelectedGroupId ??
          selectedGroupId ??
          nextGroups.find((group) => group.isDefault)?.id ??
          nextGroups[0]?.id ??
          null

        setSelectedGroupId(preferredId)
        return
      }

      throw new Error(response.error?.message || "Falha ao carregar grupos")
    } catch {
      const fallbackGroups = buildFallbackGroups(clients)
      setGroups(fallbackGroups)
      setSelectedGroupId((current) => {
        if (nextSelectedGroupId !== undefined) return nextSelectedGroupId
        if (current && fallbackGroups.some((group) => group.id === current)) return current
        return fallbackGroups[0]?.id ?? null
      })
    } finally {
      setLoadingGroups(false)
    }
  }

  const loadGroupDetail = async (groupId: number | null) => {
    if (!groupId) {
      setSelectedGroup(null)
      return
    }

    setLoadingGroupDetail(true)
    try {
      const response = await clientClient.getClientGroup(workspaceId, groupId)
      if (response.success && response.data?.group) {
        setSelectedGroup(response.data.group)
        setEditingGroupName(response.data.group.name)

        const drafts: Record<number, ClientPortalRole> = {}
        for (const member of response.data.group.members || []) {
          drafts[member.id] = member.clientPortalRole ?? "TESTER"
        }
        setMemberRoleDrafts(drafts)
        return
      }
      throw new Error(response.error?.message || "Falha ao carregar grupo")
    } catch {
      const groupSummary = groups.find((group) => group.id === groupId)
      if (!groupSummary) {
        setSelectedGroup(null)
        return
      }

      const fallbackDetail = buildFallbackGroupDetail(groupSummary, clients)
      setSelectedGroup(fallbackDetail)
      setEditingGroupName(fallbackDetail.name)

      const drafts: Record<number, ClientPortalRole> = {}
      for (const member of fallbackDetail.members) {
        drafts[member.id] = member.clientPortalRole ?? "TESTER"
      }
      setMemberRoleDrafts(drafts)
    } finally {
      setLoadingGroupDetail(false)
    }
  }

  useEffect(() => {
    if (!workspaceId) return
    refreshGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) return
    refreshGroups(selectedGroupId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients])

  useEffect(() => {
    loadGroupDetail(selectedGroupId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId, groups])

  useEffect(() => {
    if (!assignGroupId && selectedGroupId) {
      setAssignGroupId(String(selectedGroupId))
    }
  }, [assignGroupId, selectedGroupId])

  const handleEnsureDefaultGroup = async () => {
    setIsEnsuringDefault(true)
    try {
      const response = await clientClient.backfillDefaultClientGroup(workspaceId)
      if (response.success) {
        toast.success("Grupo padrão garantido com sucesso")
        await onClientsChanged()
        await refreshGroups(response.data?.group?.id ?? undefined)
      } else {
        toast.error(response.error?.message || "Erro ao garantir grupo padrão")
      }
    } catch {
      toast.error("Erro ao garantir grupo padrão")
    } finally {
      setIsEnsuringDefault(false)
    }
  }

  const handleCreateGroup = async () => {
    const name = newGroupName.trim()
    if (name.length < 2) {
      toast.error("Informe um nome de grupo com pelo menos 2 caracteres")
      return
    }

    setIsCreatingGroup(true)
    try {
      const response = await clientClient.createClientGroup(workspaceId, { name })
      if (response.success && response.data?.group) {
        toast.success(response.data.message || "Grupo criado com sucesso")
        setNewGroupName("")
        await refreshGroups(response.data.group.id)
      } else {
        toast.error(response.error?.message || "Erro ao criar grupo")
      }
    } catch {
      toast.error("Erro ao criar grupo")
    } finally {
      setIsCreatingGroup(false)
    }
  }

  const handleSaveGroupName = async () => {
    if (!selectedGroup) return
    const name = editingGroupName.trim()
    if (name.length < 2) {
      toast.error("Nome do grupo inválido")
      return
    }

    setIsSavingGroupName(true)
    try {
      const response = await clientClient.updateClientGroup(workspaceId, selectedGroup.id, { name })
      if (response.success) {
        toast.success(response.data?.message || "Grupo atualizado")
        await refreshGroups(selectedGroup.id)
      } else {
        toast.error(response.error?.message || "Erro ao atualizar grupo")
      }
    } catch {
      toast.error("Erro ao atualizar grupo")
    } finally {
      setIsSavingGroupName(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return

    if (!window.confirm(`Remover o grupo "${selectedGroup.name}"? O grupo precisa estar vazio.`)) {
      return
    }

    setIsDeletingGroup(true)
    try {
      const response = await clientClient.deleteClientGroup(workspaceId, selectedGroup.id)
      if (response.success) {
        toast.success(response.data?.message || "Grupo removido")
        setSelectedGroup(null)
        await refreshGroups(null)
      } else {
        toast.error(response.error?.message || "Erro ao remover grupo")
      }
    } catch {
      toast.error("Erro ao remover grupo")
    } finally {
      setIsDeletingGroup(false)
    }
  }

  const handleAssignClient = async () => {
    if (!assignClientId || !assignGroupId) {
      toast.error("Selecione cliente e grupo")
      return
    }

    setIsAssigning(true)
    try {
      const response = await clientClient.addClientToGroup(workspaceId, Number(assignGroupId), {
        clientId: Number(assignClientId),
        role: assignRole,
      })

      if (response.success) {
        toast.success(response.data?.message || "Cliente vinculado ao grupo")
        await onClientsChanged()
        await refreshGroups(Number(assignGroupId))
      } else {
        toast.error(response.error?.message || "Erro ao vincular cliente ao grupo")
      }
    } catch {
      toast.error("Erro ao vincular cliente ao grupo")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUpdateMemberRole = async (clientId: number) => {
    if (!selectedGroup || !memberRoleDrafts[clientId]) return

    setUpdatingMemberId(clientId)
    try {
      const response = await clientClient.updateClientGroupMemberRole(workspaceId, selectedGroup.id, clientId, {
        role: memberRoleDrafts[clientId],
      })

      if (response.success) {
        toast.success(response.data?.message || "Role atualizada")
        await onClientsChanged()
        await refreshGroups(selectedGroup.id)
      } else {
        toast.error(response.error?.message || "Erro ao atualizar role")
      }
    } catch {
      toast.error("Erro ao atualizar role")
    } finally {
      setUpdatingMemberId(null)
    }
  }

  const handleRemoveMember = async (clientId: number) => {
    if (!selectedGroup) return

    setRemovingMemberId(clientId)
    try {
      const response = await clientClient.removeClientFromGroup(workspaceId, selectedGroup.id, clientId)
      if (response.success) {
        toast.success(response.data?.message || "Cliente removido do grupo")
        await onClientsChanged()
        await refreshGroups(selectedGroup.id)
      } else {
        toast.error(response.error?.message || "Erro ao remover cliente do grupo")
      }
    } catch {
      toast.error("Erro ao remover cliente do grupo")
    } finally {
      setRemovingMemberId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Grupos de Clientes
            </CardTitle>
            <CardDescription>
              Organize clientes externos por grupo e defina roles do portal (Viewer, Tester e Admin do Grupo).
            </CardDescription>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" onClick={handleEnsureDefaultGroup} disabled={isEnsuringDefault}>
              {isEnsuringDefault ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Garantir grupo padrão
            </Button>
            <Button variant="outline" onClick={() => refreshGroups()} disabled={loadingGroups}>
              {loadingGroups ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardDescription>Grupos</CardDescription>
              <CardTitle className="text-2xl">{groups.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardDescription>Clientes sem grupo</CardDescription>
              <CardTitle className="text-2xl">{clientsWithoutGroup.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardDescription>Membros no grupo selecionado</CardDescription>
              <CardTitle className="text-2xl">{selectedGroup?.members?.length ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4" />
            Criar novo grupo
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ex.: QA Cliente X"
              maxLength={150}
            />
            <Button onClick={handleCreateGroup} disabled={isCreatingGroup}>
              {isCreatingGroup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Criar grupo
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            <p className="text-sm font-medium">Lista de grupos</p>
            {loadingGroups ? (
              <div className="flex items-center justify-center rounded-lg border py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : groups.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Nenhum grupo encontrado.
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => {
                  const isSelected = selectedGroupId === group.id
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "hover:bg-accent/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{group.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {group._count?.members ?? 0} membro(s)
                          </p>
                        </div>
                        {group.isDefault && <Badge variant="secondary">Padrão</Badge>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-4">
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Vincular cliente a grupo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Associe um cliente a um grupo e defina a role do portal.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Select value={assignClientId} onValueChange={setAssignClientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={String(client.id)}>
                        {client.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={assignGroupId} onValueChange={setAssignGroupId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={String(group.id)}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={assignRole} onValueChange={(value) => setAssignRole(value as ClientPortalRole)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleAssignClient} disabled={isAssigning}>
                  {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Vincular cliente
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              {loadingGroupDetail ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !selectedGroup ? (
                <div className="text-sm text-muted-foreground">
                  Selecione um grupo para visualizar membros e roles.
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{selectedGroup.name}</h3>
                        {selectedGroup.isDefault && <Badge variant="secondary">Padrão</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {selectedGroup.members.length} membro(s)
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={editingGroupName}
                        onChange={(e) => setEditingGroupName(e.target.value)}
                        className="sm:w-56"
                        maxLength={150}
                      />
                      <Button variant="outline" onClick={handleSaveGroupName} disabled={isSavingGroupName}>
                        {isSavingGroupName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar nome
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-destructive"
                        onClick={handleDeleteGroup}
                        disabled={isDeletingGroup || selectedGroup.isDefault}
                      >
                        {isDeletingGroup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Excluir
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {selectedGroup.members.length === 0 ? (
                    <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                      Grupo sem membros.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedGroup.members.map((member) => (
                        <div
                          key={member.id}
                          className="rounded-lg border p-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{member.nome}</p>
                              <Badge variant={getRoleBadgeVariant(member.clientPortalRole)}>
                                {ROLE_LABEL[(member.clientPortalRole ?? "TESTER") as ClientPortalRole]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                            {member.company && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {member.company}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Select
                              value={memberRoleDrafts[member.id] ?? (member.clientPortalRole ?? "TESTER")}
                              onValueChange={(value) =>
                                setMemberRoleDrafts((prev) => ({ ...prev, [member.id]: value as ClientPortalRole }))
                              }
                            >
                              <SelectTrigger className="w-full sm:w-44">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {ROLE_LABEL[role]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Button
                              variant="outline"
                              onClick={() => handleUpdateMemberRole(member.id)}
                              disabled={updatingMemberId === member.id}
                            >
                              {updatingMemberId === member.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              Role
                            </Button>

                            <Button
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={removingMemberId === member.id}
                            >
                              {removingMemberId === member.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

