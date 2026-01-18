"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreVertical, Folder, Trash2, Edit, ExternalLink, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { spaceClient, type Space, type SpaceStats } from "@/lib"
import { StorageStatsCard } from "@/components/storage-stats-card"
import Link from "next/link"

export default function SpacesPage() {
    const [spaces, setSpaces] = useState<Space[]>([])
    const [stats, setStats] = useState<SpaceStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
    const [formData, setFormData] = useState({ name: "", description: "" })
    const [submitting, setSubmitting] = useState(false)
    const { toast } = useToast()
    const { workspace, subscription } = useAuth()

    const workspaceId = workspace?.id

    useEffect(() => {
        if (workspaceId) {
            loadData()
        }
    }, [workspaceId])

    const loadData = async () => {
        if (!workspaceId) return
        setLoading(true)
        try {
            const [spacesRes, statsRes] = await Promise.all([
                spaceClient.getSpaces(workspaceId),
                spaceClient.getSpaceStats(workspaceId),
            ])

            if (spacesRes.success && spacesRes.data) {
                // Handle both { spaces: [] } and direct array (if API changes)
                const spacesList = spacesRes.data.spaces || (Array.isArray(spacesRes.data) ? spacesRes.data : [])
                setSpaces(spacesList)
            }

            if (statsRes.success && statsRes.data) {
                setStats(statsRes.data.stats)
            }
        } catch (error) {
            toast({
                title: "Erro ao carregar dados",
                description: "Não foi possível carregar os spaces",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            toast({
                title: "Nome obrigatório",
                description: "Por favor, informe um nome para o space",
                variant: "destructive",
            })
            return
        }

        setSubmitting(true)
        try {
            const response = await spaceClient.createSpace({
                workspaceId: workspaceId!,
                name: formData.name,
                description: formData.description || undefined,
            })

            if (response.success && response.data) {
                setSpaces([...spaces, response.data.space])
                setCreateDialogOpen(false)
                setFormData({ name: "", description: "" })
                toast({
                    title: "Space criado",
                    description: "Space criado com sucesso!",
                })
            } else {
                toast({
                    title: "Erro ao criar space",
                    description: response.error?.message || "Erro desconhecido",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Erro ao criar space",
                description: "Falha na comunicação com o servidor",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = async () => {
        if (!selectedSpace || !formData.name.trim()) return

        setSubmitting(true)
        try {
            const response = await spaceClient.updateSpace(selectedSpace.id, {
                name: formData.name,
                description: formData.description || undefined,
            })

            if (response.success && response.data) {
                setSpaces(spaces.map(s => s.id === selectedSpace.id ? response.data!.space : s))
                setEditDialogOpen(false)
                setSelectedSpace(null)
                setFormData({ name: "", description: "" })
                toast({
                    title: "Space atualizado",
                    description: "Alterações salvas com sucesso!",
                })
            } else {
                toast({
                    title: "Erro ao atualizar space",
                    description: response.error?.message || "Erro desconhecido",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Erro ao atualizar space",
                description: "Falha na comunicação com o servidor",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedSpace) return

        setSubmitting(true)
        try {
            const response = await spaceClient.deleteSpace(selectedSpace.id)

            if (response.success) {
                setSpaces(spaces.filter(s => s.id !== selectedSpace.id))
                setDeleteDialogOpen(false)
                setSelectedSpace(null)
                toast({
                    title: "Space deletado",
                    description: "Space e todos os arquivos foram removidos",
                })
            } else {
                toast({
                    title: "Erro ao deletar space",
                    description: response.error?.message || "Erro desconhecido",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Erro ao deletar space",
                description: "Falha na comunicação com o servidor",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    const openEditDialog = (space: Space) => {
        setSelectedSpace(space)
        setFormData({ name: space.name, description: space.description || "" })
        setEditDialogOpen(true)
    }

    const openDeleteDialog = (space: Space) => {
        setSelectedSpace(space)
        setDeleteDialogOpen(true)
    }

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Spaces</h1>
                        <p className="text-muted-foreground mt-1">Carregando...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Spaces</h1>
                    <p className="text-muted-foreground mt-1">Gerencie espaços de armazenamento de evidências</p>
                </div>
                <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-5 w-5" />
                    Novo Space
                </Button>
            </div>

            {stats && (
                <div className="max-w-md">
                    <StorageStatsCard stats={stats} planName={subscription?.plan.name} />
                </div>
            )}

            {spaces.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                            <Folder className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">Nenhum space criado</h3>
                        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                            Crie seu primeiro space para organizar e armazenar evidências de testes
                        </p>
                        <Button className="mt-6" onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar primeiro space
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {spaces.map((space) => (
                        <Card key={space.id} className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <CardTitle className="text-lg line-clamp-2 flex items-center gap-2">
                                            <Folder className="h-5 w-5 text-primary" />
                                            {space.name}
                                        </CardTitle>
                                        {space.description && (
                                            <CardDescription className="line-clamp-2">
                                                {space.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/spaces/${space.id}`}>Abrir</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openEditDialog(space)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => openDeleteDialog(space)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Deletar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <ImageIcon className="h-4 w-4" />
                                            {(space._count?.files ?? 0)} {(space._count?.files ?? 0) === 1 ? "arquivo" : "arquivos"}
                                        </span>
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/dashboard/spaces/${space.id}`}>
                                                Abrir
                                                <ExternalLink className="ml-2 h-3 w-3" />
                                            </Link>
                                        </Button>
                                    </div>

                                    {space.files.length > 0 && (
                                        <div className="flex gap-1 overflow-hidden">
                                            {space.files.slice(0, 5).map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0"
                                                >
                                                    <img
                                                        src={file.secureUrl}
                                                        alt={file.originalName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Criar Novo Space</DialogTitle>
                        <DialogDescription>
                            Crie um espaço para organizar evidências de testes
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Testes de Integração"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                maxLength={100}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                placeholder="Descrição opcional do space"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                maxLength={500}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreate} disabled={submitting}>
                            {submitting ? "Criando..." : "Criar Space"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Space</DialogTitle>
                        <DialogDescription>
                            Atualize as informações do space
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nome *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                maxLength={100}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Descrição</Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                maxLength={500}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submitting}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEdit} disabled={submitting}>
                            {submitting ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deletar Space</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja deletar o space "{selectedSpace?.name}"?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <p className="text-sm text-destructive font-medium">
                            ⚠️ Atenção: Esta ação não pode ser desfeita
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Todos os arquivos ({selectedSpace?._count?.files ?? 0}) armazenados neste space serão permanentemente removidos.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                            {submitting ? "Deletando..." : "Deletar Space"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
