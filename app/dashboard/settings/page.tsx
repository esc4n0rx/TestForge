"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Camera } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas preferências e configurações da conta</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Informações básicas da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">JS</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <p className="font-medium">Foto de perfil</p>
              <p className="text-sm text-muted-foreground">JPG, GIF ou PNG. Máximo 1MB</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" defaultValue="João Silva" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="joao@empresa.com" />
            </div>
          </div>

          <Button>Salvar alterações</Button>
        </CardContent>
      </Card>

      {/* Company */}
      <Card>
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
          <CardDescription>Informações da sua organização</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Nome da empresa</Label>
            <Input id="company" defaultValue="Acme Corporation" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Setor</Label>
            <Select defaultValue="technology">
              <SelectTrigger id="industry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Tecnologia</SelectItem>
                <SelectItem value="finance">Finanças</SelectItem>
                <SelectItem value="healthcare">Saúde</SelectItem>
                <SelectItem value="retail">Varejo</SelectItem>
                <SelectItem value="manufacturing">Manufatura</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>Atualizar empresa</Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferências</CardTitle>
          <CardDescription>Personalize sua experiência no TestFlow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Select defaultValue="pt">
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português (Brasil)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por email</Label>
                <p className="text-sm text-muted-foreground">Receba atualizações sobre seus flows</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações de comentários</Label>
                <p className="text-sm text-muted-foreground">Quando alguém comentar em seus flows</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações de compartilhamento</Label>
                <p className="text-sm text-muted-foreground">Quando um flow for compartilhado com você</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>Gerencie a segurança da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Senha</p>
              <p className="text-sm text-muted-foreground">Última alteração há 3 meses</p>
            </div>
            <Button variant="outline">Alterar senha</Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autenticação de dois fatores</Label>
              <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis da conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Excluir conta</p>
              <p className="text-sm text-muted-foreground">Exclua permanentemente sua conta e todos os dados</p>
            </div>
            <Button variant="destructive">Excluir conta</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
