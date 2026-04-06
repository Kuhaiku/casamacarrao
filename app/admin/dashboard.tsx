// app/admin/page.tsx
"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Save, X, Lock, Unlock } from "lucide-react"
import type { Size } from "@/lib/types"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function SizeCard({ 
  size, 
  onEdit, 
  onDelete 
}: { 
  size: Size
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{size.name}</CardTitle>
            <CardDescription className="text-2xl font-bold text-primary mt-1">
              {formatCurrency(size.price)}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-muted rounded-lg flex flex-col items-center">
            <div className="font-bold text-lg">{size.maxPastas}</div>
            <div className="text-muted-foreground mb-2">Massas</div>
            {size.strictMaxPastas ? (
              <div className="flex items-center text-[10px] text-destructive"><Lock className="w-3 h-3 mr-1"/> Fixo</div>
            ) : (
              <div className="flex items-center text-[10px] text-green-600"><Unlock className="w-3 h-3 mr-1"/> Extra</div>
            )}
          </div>
          <div className="text-center p-3 bg-muted rounded-lg flex flex-col items-center">
            <div className="font-bold text-lg">{size.maxIngredients}</div>
            <div className="text-muted-foreground mb-2">Ingred.</div>
            {size.strictMaxIngredients ? (
              <div className="flex items-center text-[10px] text-destructive"><Lock className="w-3 h-3 mr-1"/> Fixo</div>
            ) : (
              <div className="flex items-center text-[10px] text-green-600"><Unlock className="w-3 h-3 mr-1"/> Extra</div>
            )}
          </div>
          <div className="text-center p-3 bg-muted rounded-lg flex flex-col items-center">
            <div className="font-bold text-lg">{size.maxSauces}</div>
            <div className="text-muted-foreground mb-2">Molhos</div>
            {size.strictMaxSauces ? (
              <div className="flex items-center text-[10px] text-destructive"><Lock className="w-3 h-3 mr-1"/> Fixo</div>
            ) : (
              <div className="flex items-center text-[10px] text-green-600"><Unlock className="w-3 h-3 mr-1"/> Extra</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SizeForm({ 
  size, 
  onSave, 
  onCancel 
}: { 
  size?: Size
  onSave: (data: Omit<Size, 'id'> & { id?: string }) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: size?.name || "",
    price: size?.price?.toString() || "",
    maxPastas: size?.maxPastas?.toString() || "1",
    strictMaxPastas: size?.strictMaxPastas ?? true,
    maxIngredients: size?.maxIngredients?.toString() || "4",
    strictMaxIngredients: size?.strictMaxIngredients ?? false,
    maxSauces: size?.maxSauces?.toString() || "1",
    strictMaxSauces: size?.strictMaxSauces ?? false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: size?.id,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      maxPastas: parseInt(formData.maxPastas) || 1,
      strictMaxPastas: formData.strictMaxPastas,
      maxIngredients: parseInt(formData.maxIngredients) || 4,
      strictMaxIngredients: formData.strictMaxIngredients,
      maxSauces: parseInt(formData.maxSauces) || 1,
      strictMaxSauces: formData.strictMaxSauces,
    })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader className="pb-4">
          <CardTitle>{size ? "Editar Tamanho" : "Novo Tamanho"}</CardTitle>
          <CardDescription>Defina os limites e se eles podem ser ultrapassados pagando extra.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Tamanho</Label>
              <Input
                id="name"
                placeholder='Ex: "G (400g)", "Monstro (1kg)"'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço Base (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 p-4 bg-muted/50 rounded-lg border">
            {/* Massas */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxPastas">Qtd. Massas</Label>
                <Input
                  id="maxPastas"
                  type="number"
                  min="1"
                  value={formData.maxPastas}
                  onChange={(e) => setFormData({ ...formData, maxPastas: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background">
                <div className="space-y-0.5">
                  <Label className="text-xs">Travar limite?</Label>
                  <p className="text-[10px] text-muted-foreground">Não permite extra</p>
                </div>
                <Switch
                  checked={formData.strictMaxPastas}
                  onCheckedChange={(checked) => setFormData({ ...formData, strictMaxPastas: checked })}
                />
              </div>
            </div>

            {/* Ingredientes */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxIngredients">Qtd. Ingredientes</Label>
                <Input
                  id="maxIngredients"
                  type="number"
                  min="1"
                  value={formData.maxIngredients}
                  onChange={(e) => setFormData({ ...formData, maxIngredients: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background">
                <div className="space-y-0.5">
                  <Label className="text-xs">Travar limite?</Label>
                  <p className="text-[10px] text-muted-foreground">Não permite extra</p>
                </div>
                <Switch
                  checked={formData.strictMaxIngredients}
                  onCheckedChange={(checked) => setFormData({ ...formData, strictMaxIngredients: checked })}
                />
              </div>
            </div>

            {/* Molhos */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxSauces">Qtd. Molhos</Label>
                <Input
                  id="maxSauces"
                  type="number"
                  min="1"
                  value={formData.maxSauces}
                  onChange={(e) => setFormData({ ...formData, maxSauces: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background">
                <div className="space-y-0.5">
                  <Label className="text-xs">Travar limite?</Label>
                  <p className="text-[10px] text-muted-foreground">Não permite extra</p>
                </div>
                <Switch
                  checked={formData.strictMaxSauces}
                  onCheckedChange={(checked) => setFormData({ ...formData, strictMaxSauces: checked })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}

function SettingsCard() {
  const { settings, updateSettings } = useStore()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    extraIngredientPrice: settings.extraIngredientPrice.toString(),
    extraCheesePrice: settings.extraCheesePrice.toString(),
  })

  const handleSave = () => {
    updateSettings({
      extraIngredientPrice: parseFloat(formData.extraIngredientPrice) || 0,
      extraCheesePrice: parseFloat(formData.extraCheesePrice) || 0,
    })
    setEditing(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Valores Extras</CardTitle>
            <CardDescription>Preços para adicionais (quando a trava de limite estiver desativada)</CardDescription>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Ingrediente / Molho Adicional (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.extraIngredientPrice}
                  onChange={(e) => setFormData({ ...formData, extraIngredientPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Adicional de Queijo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.extraCheesePrice}
                  onChange={(e) => setFormData({ ...formData, extraCheesePrice: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Ingrediente / Molho Adicional</div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(settings.extraIngredientPrice)}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Adicional de Queijo</div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(settings.extraCheesePrice)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminSizesPage() {
  const { sizes, addSize, updateSize, deleteSize } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)

  const handleSave = (data: Omit<Size, 'id'> & { id?: string }) => {
    if (data.id) {
      updateSize(data.id, data)
    } else {
      addSize({ ...data, id: `size-${Date.now()}` })
    }
    setShowForm(false)
    setEditingSize(null)
  }

  const handleEdit = (size: Size) => {
    setEditingSize(size)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingSize(null)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tamanhos e Regras</h1>
          <p className="text-muted-foreground mt-1">
            Configure os tamanhos disponíveis e seus limites de ingredientes
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tamanho
          </Button>
        )}
      </div>

      <SettingsCard />

      {showForm && (
        <SizeForm
          size={editingSize || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Tamanhos Disponíveis</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sizes.map((size) => (
            <SizeCard
              key={size.id}
              size={size}
              onEdit={() => handleEdit(size)}
              onDelete={() => deleteSize(size.id)}
            />
          ))}
        </div>
        {sizes.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhum tamanho cadastrado. Clique em "Novo Tamanho" para começar.
          </Card>
        )}
      </div>
    </div>
  )
}