"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save, X } from "lucide-react"
import type { CategoryType, MenuItem } from "@/lib/types"

const categoryLabels: Record<CategoryType, string> = {
  pasta: "Massas",
  sauce: "Molhos",
  seasoning: "Temperos",
  ingredient: "Ingredientes",
}

const categoryDescriptions: Record<CategoryType, string> = {
  pasta: "Tipos de massa disponíveis",
  sauce: "Molhos para o macarrão",
  seasoning: "Temperos (sempre livres)",
  ingredient: "Ingredientes adicionais",
}

function MenuItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: MenuItem
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Switch checked={item.isActive} onCheckedChange={onToggle} />
        <span className={item.isActive ? "text-foreground" : "text-muted-foreground line-through"}>
          {item.name}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="text-destructive hover:text-destructive h-8 w-8"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function AddItemForm({
  category,
  onAdd,
  onCancel,
}: {
  category: CategoryType
  onAdd: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(name.trim())
      setName("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 bg-muted/30 rounded-lg border border-dashed">
      <Input
        placeholder={`Nome do item de ${categoryLabels[category].toLowerCase()}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1"
        autoFocus
      />
      <Button type="submit" size="sm">
        <Save className="h-4 w-4 mr-1" />
        Salvar
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        <X className="h-4 w-4" />
      </Button>
    </form>
  )
}

function CategorySection({ category }: { category: CategoryType }) {
  const { menuItems, addMenuItem, toggleMenuItemActive, deleteMenuItem } = useStore()
  const [showAddForm, setShowAddForm] = useState(false)

  const items = menuItems.filter((item) => item.category === category)
  const activeCount = items.filter((item) => item.isActive).length

  const handleAdd = (name: string) => {
    addMenuItem({
      id: `${category}-${Date.now()}`,
      name,
      category,
      isActive: true,
    })
    setShowAddForm(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {categoryLabels[category]}
              <span className="text-sm font-normal text-muted-foreground">
                ({activeCount}/{items.length} ativos)
              </span>
            </CardTitle>
            <CardDescription>{categoryDescriptions[category]}</CardDescription>
          </div>
          {!showAddForm && (
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {showAddForm && (
          <AddItemForm
            category={category}
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        )}
        {items.map((item) => (
          <MenuItemRow
            key={item.id}
            item={item}
            onToggle={() => toggleMenuItemActive(item.id)}
            onDelete={() => deleteMenuItem(item.id)}
          />
        ))}
        {items.length === 0 && !showAddForm && (
          <p className="text-center text-muted-foreground py-4">
            Nenhum item cadastrado nesta categoria.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function BulkAddForm() {
  const { addMenuItem } = useStore()
  const [category, setCategory] = useState<CategoryType>("ingredient")
  const [items, setItems] = useState("")
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const names = items.split("\n").map((s) => s.trim()).filter(Boolean)
    names.forEach((name) => {
      addMenuItem({
        id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        category,
        isActive: true,
      })
    })
    setItems("")
    setShowForm(false)
  }

  if (!showForm) {
    return (
      <Button variant="outline" onClick={() => setShowForm(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Vários Itens
      </Button>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Adicionar Vários Itens</CardTitle>
          <CardDescription>Digite um item por linha</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CategoryType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Itens (um por linha)</Label>
            <textarea
              className="w-full min-h-[120px] p-3 border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Bacon&#10;Frango&#10;Camarão"
              value={items}
              onChange={(e) => setItems(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Adicionar Todos
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}

export default function AdminMenuPage() {
  const categories: CategoryType[] = ["pasta", "sauce", "ingredient", "seasoning"]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão do Cardápio</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os itens disponíveis para montagem dos pedidos
          </p>
        </div>
        <BulkAddForm />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {categories.map((category) => (
          <CategorySection key={category} category={category} />
        ))}
      </div>
    </div>
  )
}
