// app/admin/menu/page.tsx
"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, Trash2, Save, X, Pencil, Lock, Unlock, 
  UtensilsCrossed, PackageOpen, Settings2 
} from "lucide-react"
import type { CategoryType, MenuItem, Size, Product } from "@/lib/types"

// ============================================================================
// COMPONENTES COMPARTILHADOS / UTILITÁRIOS
// ============================================================================
function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// ============================================================================
// ABA 1: CARDÁPIO (Massas, Molhos, Temperos, Ingredientes, Extras)
// ============================================================================
const categoryLabels: Record<string, string> = {
  pasta: "Massas",
  sauce: "Molhos",
  seasoning: "Temperos",
  ingredient: "Ingredientes",
  extra: "Adicionais Extras (Pagos)",
}

const categoryDescriptions: Record<string, string> = {
  pasta: "Tipos de massa disponíveis",
  sauce: "Molhos para o macarrão",
  seasoning: "Temperos (sempre livres)",
  ingredient: "Ingredientes adicionais",
  extra: "Itens com preço individual (Ex: Queijo Extra, Bacon Extra)",
}

function MenuItemRow({ item, onToggle, onDelete, onEdit }: { item: MenuItem; onToggle: () => void; onDelete: () => void; onEdit: (name: string, price?: number) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editPrice, setEditPrice] = useState(item.price?.toString() || "")

  const handleSave = () => {
    if (editName.trim()) {
      onEdit(editName.trim(), item.category === "extra" ? parseFloat(editPrice.replace(',', '.')) || 0 : undefined)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex gap-2 p-3 bg-muted/30 rounded-lg border border-dashed flex-wrap sm:flex-nowrap items-center">
        <Input 
          value={editName} 
          onChange={(e) => setEditName(e.target.value)} 
          className="flex-1 min-w-[150px] h-9" 
          autoFocus 
        />
        {item.category === "extra" && (
          <Input 
            type="number" 
            step="0.01" 
            min="0" 
            value={editPrice} 
            onChange={(e) => setEditPrice(e.target.value)} 
            className="w-24 shrink-0 h-9" 
            placeholder="Preço (R$)" 
          />
        )}
        <Button size="sm" onClick={handleSave} className="h-9 shrink-0"><Save className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-9 w-9 p-0 shrink-0"><X className="h-4 w-4" /></Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Switch checked={item.isActive} onCheckedChange={onToggle} />
        <div className="flex flex-col">
          <span className={item.isActive ? "text-foreground font-medium" : "text-muted-foreground line-through"}>
            {item.name}
          </span>
          {item.category === "extra" && item.price !== undefined && (
            <span className="text-xs text-primary font-bold">{formatCurrency(item.price)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="text-stone-500 hover:text-stone-700 h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive h-8 w-8">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function AddItemForm({ category, onAdd, onCancel }: { category: string; onAdd: (name: string, price?: number) => void; onCancel: () => void }) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(name.trim(), category === "extra" ? parseFloat(price.replace(',', '.')) || 0 : undefined)
      setName("")
      setPrice("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 bg-muted/30 rounded-lg border border-dashed flex-wrap sm:flex-nowrap">
      <Input placeholder={`Nome do item de ${categoryLabels[category]?.toLowerCase()}`} value={name} onChange={(e) => setName(e.target.value)} className="flex-1 min-w-[150px]" autoFocus required />
      
      {category === "extra" && (
        <Input type="number" step="0.01" min="0" placeholder="Preço (R$)" value={price} onChange={(e) => setPrice(e.target.value)} className="w-28 shrink-0" required />
      )}
      
      <Button type="submit" size="sm" className="shrink-0"><Save className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Salvar</span></Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="shrink-0"><X className="h-4 w-4" /></Button>
    </form>
  )
}

function CategorySection({ category }: { category: string }) {
  const { menuItems, addMenuItem, updateMenuItem, toggleMenuItemActive, deleteMenuItem } = useStore()
  const [showAddForm, setShowAddForm] = useState(false)

  const items = menuItems.filter((item) => item.category === category)
  const activeCount = items.filter((item) => item.isActive).length

  const handleAdd = (name: string, price?: number) => {
    addMenuItem({ id: `${category}-${Date.now()}`, name, category: category as any, isActive: true, price })
    setShowAddForm(false)
  }

  return (
    <Card className={category === "extra" ? "border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {categoryLabels[category]}
              <span className="text-sm font-normal text-muted-foreground">({activeCount}/{items.length} ativos)</span>
            </CardTitle>
            <CardDescription>{categoryDescriptions[category]}</CardDescription>
          </div>
          {!showAddForm && (
            <Button variant={category === "extra" ? "default" : "outline"} size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {showAddForm && <AddItemForm category={category} onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />}
        {items.map((item) => (
          <MenuItemRow 
            key={item.id} 
            item={item} 
            onToggle={() => toggleMenuItemActive(item.id)} 
            onDelete={() => deleteMenuItem(item.id)} 
            onEdit={(name, price) => updateMenuItem(item.id, { name, price })}
          />
        ))}
        {items.length === 0 && !showAddForm && <p className="text-center text-muted-foreground py-4">Nenhum item cadastrado.</p>}
      </CardContent>
    </Card>
  )
}

function BulkAddForm() {
  const { addMenuItem } = useStore()
  const [category, setCategory] = useState<string>("ingredient")
  const [items, setItems] = useState("")
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const lines = items.split("\n").map((s) => s.trim()).filter(Boolean)
    
    lines.forEach((line) => {
      if (category === "extra") {
        const parts = line.split(",")
        const name = parts[0].trim()
        let price = 0
        if (parts.length > 1) {
          price = parseFloat(parts[1].trim().replace(',', '.')) || 0
        }
        
        addMenuItem({
          id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name, 
          category: category as any, 
          isActive: true,
          price
        })
      } else {
        addMenuItem({
          id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: line, 
          category: category as any, 
          isActive: true,
        })
      }
    })
    
    setItems("")
    setShowForm(false)
  }

  if (!showForm) {
    return (
      <Button variant="outline" onClick={() => setShowForm(true)}>
        <Plus className="h-4 w-4 mr-2" /> Adicionar Vários
      </Button>
    )
  }

  return (
    <Card className="mb-6 border-blue-200">
      <form onSubmit={handleSubmit}>
        <CardHeader className="bg-blue-50/50 pb-4">
          <CardTitle>Adicionar Vários Itens Rápido</CardTitle>
          <CardDescription>Insira vários itens de uma vez só</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Para qual categoria?</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lista de Itens (um por linha)</Label>
            <textarea
              className="w-full min-h-[140px] p-3 border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={category === "extra" ? "Bacon, 5.00\nBorda Recheada, 8.50" : "Alho\nCebola\nTomate"}
              value={items}
              onChange={(e) => setItems(e.target.value)}
            />
            {category === "extra" ? (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                ⭐ <b>Dica para Extras:</b> Digite o Nome e o Preço separados por vírgula na mesma linha.<br/>
                Exemplo: <b>Bacon Extra, 5.50</b>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Digite um ingrediente por linha.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit"><Save className="h-4 w-4 mr-2" /> Adicionar Todos</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}><X className="h-4 w-4 mr-2" /> Cancelar</Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}

function MenuTabContent() {
  const categories = ["pasta", "sauce", "ingredient", "seasoning", "extra"]
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Itens do Macarrão</h2>
          <p className="text-muted-foreground mt-1">Gerencie os ingredientes e os adicionais pagos da montagem.</p>
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

// ============================================================================
// ABA 2: PRODUTOS (Bebidas, Caldos, etc)
// ============================================================================

function ProductCard({ prod, onToggle, onDelete, onEdit }: { prod: Product; onToggle: () => void; onDelete: () => void; onEdit: (name: string, price: number) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(prod.name)
  const [editPrice, setEditPrice] = useState(prod.price.toString())

  const handleSave = () => {
    if (editName.trim() && editPrice) {
      onEdit(editName.trim(), parseFloat(editPrice.replace(',', '.')) || 0)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Card className={prod.isActive ? "" : "opacity-50"}>
        <CardContent className="p-4 flex flex-col gap-3">
          <Input 
            value={editName} 
            onChange={(e) => setEditName(e.target.value)} 
            className="h-9" 
            autoFocus 
          />
          <div className="flex gap-2">
            <Input 
              type="number" 
              step="0.01" 
              min="0" 
              value={editPrice} 
              onChange={(e) => setEditPrice(e.target.value)} 
              className="h-9 flex-1" 
              placeholder="Preço (R$)"
            />
            <Button size="sm" onClick={handleSave} className="h-9 shrink-0"><Save className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-9 w-9 p-0 shrink-0"><X className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={prod.isActive ? "" : "opacity-50"}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold">{prod.name}</p>
          <p className="text-sm text-primary font-bold">{formatCurrency(prod.price)}</p>
        </div>
        <div className="flex items-center gap-1">
          <Switch checked={prod.isActive} onCheckedChange={onToggle} className="mr-2" />
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="text-stone-500 hover:text-stone-700 h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProductsTabContent() {
  const { productCategories, products, addProductCategory, deleteProductCategory, addProduct, updateProduct, toggleProductActive, deleteProduct } = useStore()
  
  const [catName, setCatName] = useState("")
  const [prodName, setProdName] = useState("")
  const [prodPrice, setProdPrice] = useState("")
  const [prodCat, setProdCat] = useState("")

  const handleAddCategory = () => {
    if (!catName) return
    addProductCategory({ name: catName, isActive: true })
    setCatName("")
  }

  const handleAddProduct = () => {
    if (!prodName || !prodPrice || !prodCat) return
    addProduct({ name: prodName, price: parseFloat(prodPrice.replace(',', '.')), categoryId: prodCat, isActive: true })
    setProdName("")
    setProdPrice("")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Produtos Adicionais</h2>
        <p className="text-muted-foreground mt-1">Gerencie Bebidas, Caldos, Sobremesas e produtos de venda direta.</p>
      </div>

      <Tabs defaultValue="produtos" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="categorias" className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle>Nova Categoria (Ex: Bebidas, Caldos)</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Input placeholder="Nome da Categoria" value={catName} onChange={(e) => setCatName(e.target.value)} />
              <Button onClick={handleAddCategory}><Plus className="h-4 w-4 mr-2"/> Adicionar</Button>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {productCategories.map(cat => (
              <Card key={cat.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="font-semibold">{cat.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => deleteProductCategory(cat.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="produtos" className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle>Novo Produto</CardTitle></CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <Select value={prodCat} onValueChange={setProdCat}>
                <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Selecione a Categoria" /></SelectTrigger>
                <SelectContent>
                  {productCategories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Input placeholder="Nome do Produto" value={prodName} onChange={(e) => setProdName(e.target.value)} className="flex-1" />
              <Input type="number" step="0.01" placeholder="Preço (R$)" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className="w-full md:w-[150px]" />
              <Button onClick={handleAddProduct}><Plus className="h-4 w-4 mr-2"/> Salvar</Button>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {productCategories.map(cat => {
              const catProducts = products.filter(p => p.categoryId === cat.id)
              if (catProducts.length === 0) return null
              return (
                <div key={cat.id}>
                  <h3 className="text-xl font-bold mb-3 border-b pb-2">{cat.name}</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {catProducts.map(prod => (
                      <ProductCard 
                        key={prod.id} 
                        prod={prod} 
                        onToggle={() => toggleProductActive(prod.id)} 
                        onDelete={() => deleteProduct(prod.id)}
                        onEdit={(name, price) => updateProduct(prod.id, { name, price })}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// ABA 3: TAMANHOS E REGRAS
// ============================================================================
function SizeCard({ size, onEdit, onDelete }: { size: Size; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{size.name}</CardTitle>
            <CardDescription className="text-2xl font-bold text-primary mt-1">{formatCurrency(size.price)}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
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

function SizeForm({ size, onSave, onCancel }: { size?: Size; onSave: (data: Omit<Size, 'id'> & { id?: string }) => void; onCancel: () => void }) {
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
      id: size?.id, name: formData.name, price: parseFloat(formData.price.replace(',', '.')) || 0,
      maxPastas: parseInt(formData.maxPastas) || 1, strictMaxPastas: formData.strictMaxPastas,
      maxIngredients: parseInt(formData.maxIngredients) || 4, strictMaxIngredients: formData.strictMaxIngredients,
      maxSauces: parseInt(formData.maxSauces) || 1, strictMaxSauces: formData.strictMaxSauces,
    })
  }

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <CardHeader className="pb-4">
          <CardTitle>{size ? "Editar Tamanho" : "Novo Tamanho"}</CardTitle>
          <CardDescription>Defina os limites e se eles podem ser ultrapassados pagando extra.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do Tamanho</Label>
              <Input placeholder='Ex: "G (400g)", "Monstro (1kg)"' value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Preço Base (R$)</Label>
              <Input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 p-4 bg-muted/50 rounded-lg border">
            {['Pastas', 'Ingredients', 'Sauces'].map((type) => {
              const keyMap: any = { Pastas: 'Massas', Ingredients: 'Ingredientes', Sauces: 'Molhos' }
              const fieldMax = `max${type}` as keyof typeof formData
              const fieldStrict = `strictMax${type}` as keyof typeof formData
              
              return (
                <div key={type} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Qtd. {keyMap[type]}</Label>
                    <Input type="number" min="1" value={formData[fieldMax] as string} onChange={(e) => setFormData({ ...formData, [fieldMax]: e.target.value })} required />
                  </div>
                  <div className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background">
                    <div className="space-y-0.5">
                      <Label className="text-xs">Travar limite?</Label>
                      <p className="text-[10px] text-muted-foreground">Não permite extra</p>
                    </div>
                    <Switch checked={formData[fieldStrict] as boolean} onCheckedChange={(checked) => setFormData({ ...formData, [fieldStrict]: checked })} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit"><Save className="h-4 w-4 mr-2" /> Salvar</Button>
            <Button type="button" variant="outline" onClick={onCancel}><X className="h-4 w-4 mr-2" /> Cancelar</Button>
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
    extraPastaPrice: (settings.extraPastaPrice || 0).toString(),
    extraSaucePrice: (settings.extraSaucePrice || 0).toString(),
    extraIngredientPrice: (settings.extraIngredientPrice || 0).toString(),
  })

  const handleSave = () => {
    updateSettings({ 
      extraPastaPrice: parseFloat(formData.extraPastaPrice.replace(',', '.')) || 0,
      extraSaucePrice: parseFloat(formData.extraSaucePrice.replace(',', '.')) || 0,
      extraIngredientPrice: parseFloat(formData.extraIngredientPrice.replace(',', '.')) || 0,
    })
    setEditing(false)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Valores de Limites Extras</CardTitle>
            <CardDescription>Taxa cobrada quando o cliente ultrapassa a quantidade limite de itens do tamanho.</CardDescription>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="h-4 w-4 mr-2" /> Editar</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2"><Label>Extra por Massa (R$)</Label><Input type="number" step="0.01" value={formData.extraPastaPrice} onChange={(e) => setFormData({ ...formData, extraPastaPrice: e.target.value })} /></div>
              <div className="space-y-2"><Label>Extra por Molho (R$)</Label><Input type="number" step="0.01" value={formData.extraSaucePrice} onChange={(e) => setFormData({ ...formData, extraSaucePrice: e.target.value })} /></div>
              <div className="space-y-2"><Label>Extra por Ingred. (R$)</Label><Input type="number" step="0.01" value={formData.extraIngredientPrice} onChange={(e) => setFormData({ ...formData, extraIngredientPrice: e.target.value })} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Salvar</Button>
              <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-2" /> Cancelar</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Massa Extra</div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(settings.extraPastaPrice || 0)}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Molho Extra</div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(settings.extraSaucePrice || 0)}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Ingrediente Extra</div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(settings.extraIngredientPrice || 0)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RulesTabContent() {
  const { sizes, addSize, updateSize, deleteSize } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)

  const handleSave = (data: Omit<Size, 'id'> & { id?: string }) => {
    if (data.id) updateSize(data.id, data)
    else addSize({ ...data, id: `size-${Date.now()}` })
    setShowForm(false)
    setEditingSize(null)
  }

  const handleEdit = (size: Size) => { setEditingSize(size); setShowForm(true) }
  const handleCancel = () => { setShowForm(false); setEditingSize(null) }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tamanhos e Regras</h2>
          <p className="text-muted-foreground mt-1">Configure os tamanhos e seus limites</p>
        </div>
        {!showForm && <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Novo Tamanho</Button>}
      </div>

      <SettingsCard />

      {showForm && <SizeForm size={editingSize || undefined} onSave={handleSave} onCancel={handleCancel} />}

      <div>
        <h2 className="text-xl font-semibold mb-4">Tamanhos Disponíveis</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sizes.map((size) => (
            <SizeCard key={size.id} size={size} onEdit={() => handleEdit(size)} onDelete={() => deleteSize(size.id)} />
          ))}
        </div>
        {sizes.length === 0 && <Card className="p-8 text-center text-muted-foreground">Nenhum tamanho cadastrado.</Card>}
      </div>
    </div>
  )
}

// ============================================================================
// PÁGINA PRINCIPAL UNIFICADA (TABS)
// ============================================================================
export default function UnifiedMenuPage() {
  return (
    <div className="container max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
          Gestão do Cardápio
        </h1>
        <p className="text-stone-500 font-medium mt-1">
          Gerencie ingredientes, produtos avulsos e regras de tamanho em um único lugar.
        </p>
      </div>

      <Tabs defaultValue="cardapio" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl bg-stone-200/50 p-1 rounded-xl">
          <TabsTrigger value="cardapio" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white transition-all">
            <UtensilsCrossed className="w-4 h-4 mr-2" />
            Ingredientes e Extras
          </TabsTrigger>
          <TabsTrigger value="produtos" className="rounded-lg font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            <PackageOpen className="w-4 h-4 mr-2" />
            Produtos Avulsos
          </TabsTrigger>
          <TabsTrigger value="regras" className="rounded-lg font-bold data-[state=active]:bg-stone-800 data-[state=active]:text-white transition-all">
            <Settings2 className="w-4 h-4 mr-2" />
            Tamanhos e Regras
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 p-6 min-h-[60vh]">
          <TabsContent value="cardapio" className="m-0 focus-visible:outline-none">
            <MenuTabContent />
          </TabsContent>

          <TabsContent value="produtos" className="m-0 focus-visible:outline-none">
            <ProductsTabContent />
          </TabsContent>

          <TabsContent value="regras" className="m-0 focus-visible:outline-none">
            <RulesTabContent />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}