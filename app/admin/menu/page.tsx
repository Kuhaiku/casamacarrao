// app/admin/menu/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, Trash2, Save, X, Pencil, Lock, Unlock, 
  UtensilsCrossed, PackageOpen, Settings2, Box
} from "lucide-react"
import type { CategoryType, MenuItem, Size, Product, ProductCategory } from "@/lib/types"

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

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
        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 min-w-[150px] h-9" autoFocus />
        {item.category === "extra" && (
          <Input type="number" step="0.01" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-24 shrink-0 h-9" placeholder="Preço (R$)" />
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
          <span className={item.isActive ? "text-foreground font-medium" : "text-muted-foreground line-through"}>{item.name}</span>
          {item.category === "extra" && item.price !== undefined && (
            <span className="text-xs text-primary font-bold">{formatCurrency(item.price)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="text-stone-500 hover:text-stone-700 h-8 w-8"><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
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
      {category === "extra" && <Input type="number" step="0.01" min="0" placeholder="Preço (R$)" value={price} onChange={(e) => setPrice(e.target.value)} className="w-28 shrink-0" required />}
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
            <CardTitle className="flex items-center gap-2">{categoryLabels[category]}<span className="text-sm font-normal text-muted-foreground">({activeCount}/{items.length} ativos)</span></CardTitle>
            <CardDescription>{categoryDescriptions[category]}</CardDescription>
          </div>
          {!showAddForm && <Button variant={category === "extra" ? "default" : "outline"} size="sm" onClick={() => setShowAddForm(true)}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {showAddForm && <AddItemForm category={category} onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />}
        {items.map((item) => (
          <MenuItemRow key={item.id} item={item} onToggle={() => toggleMenuItemActive(item.id)} onDelete={() => deleteMenuItem(item.id)} onEdit={(name, price) => updateMenuItem(item.id, { name, price })} />
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
        addMenuItem({
          id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: parts[0].trim(), 
          category: category as any, 
          isActive: true,
          price: parts.length > 1 ? parseFloat(parts[1].trim().replace(',', '.')) || 0 : 0
        })
      } else {
        addMenuItem({
          id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: line, category: category as any, isActive: true,
        })
      }
    })
    setItems("")
    setShowForm(false)
  }

  if (!showForm) return <Button variant="outline" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Adicionar Vários</Button>

  return (
    <Card className="mb-6 border-blue-200">
      <form onSubmit={handleSubmit}>
        <CardHeader className="bg-blue-50/50 pb-4"><CardTitle>Adicionar Vários Itens Rápido</CardTitle></CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Para qual categoria?</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lista de Itens (um por linha)</Label>
            <textarea className="w-full min-h-[140px] p-3 border rounded-lg bg-background resize-none" value={items} onChange={(e) => setItems(e.target.value)} />
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
        {categories.map((category) => <CategorySection key={category} category={category} />)}
      </div>
    </div>
  )
}

function ProductCard({ prod, categories }: { prod: Product; categories: ProductCategory[] }) {
  const { updateProduct, toggleProductActive, deleteProduct, settings } = useStore()
  const [isEditing, setIsEditing] = useState(false)
  
  const [name, setName] = useState(prod.name)
  const [price, setPrice] = useState(prod.price.toString())
  const [categoryId, setCategoryId] = useState(prod.categoryId)
  const [cobrarEmbalagem, setCobrarEmbalagem] = useState(prod.tipoEmbalagem && prod.tipoEmbalagem !== 'nenhuma')
  const [tipoEmbalagem, setTipoEmbalagem] = useState<"padrao" | "personalizada">(prod.tipoEmbalagem === "personalizada" ? "personalizada" : "padrao")
  const [taxaEmbalagem, setTaxaEmbalagem] = useState(prod.taxaEmbalagem?.toString() || "0")

  const handleSave = () => {
    const finalTipo = cobrarEmbalagem ? tipoEmbalagem : "nenhuma"
    const finalTaxa = finalTipo === "personalizada" ? parseFloat(taxaEmbalagem.replace(',', '.')) || 0 : 0

    updateProduct(prod.id, {
      name,
      price: parseFloat(price.replace(',', '.')) || 0,
      categoryId,
      tipoEmbalagem: finalTipo,
      taxaEmbalagem: finalTaxa
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Card className="col-span-full md:col-span-2 lg:col-span-3 border-blue-200 dark:border-blue-900 shadow-md">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center mb-2 pb-2 border-b">
            <h4 className="font-bold text-blue-700 dark:text-blue-400">Editar Produto</h4>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
            <Input type="number" step="0.01" placeholder="Preço (R$)" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full md:w-[120px]" />
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded border border-stone-200 dark:border-stone-700">
            <div className="flex items-center space-x-2 mb-3">
              <Switch checked={!!cobrarEmbalagem} onCheckedChange={setCobrarEmbalagem} />
              <Label className="font-bold cursor-pointer text-sm">Cobrar embalagem?</Label>
            </div>
            {cobrarEmbalagem && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={tipoEmbalagem} onValueChange={(v: any) => setTipoEmbalagem(v)}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="padrao">Padrão ({formatCurrency(settings.taxaEmbalagemGlobal || 0)})</SelectItem>
                    <SelectItem value="personalizada">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
                {tipoEmbalagem === "personalizada" && (
                  <Input type="number" step="0.01" placeholder="R$" value={taxaEmbalagem} onChange={(e) => setTaxaEmbalagem(e.target.value)} className="w-full sm:w-[120px]" />
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white"><Save className="h-4 w-4 mr-2"/> Salvar Alterações</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`hover:shadow-md transition-all ${prod.isActive ? "" : "opacity-50"}`}>
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-lg leading-tight">{prod.name}</p>
            <p className="text-sm text-primary font-black mt-1">{formatCurrency(prod.price)}</p>
          </div>
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
            <Switch checked={prod.isActive} onCheckedChange={() => toggleProductActive(prod.id)} className="mx-1" />
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8 text-stone-500 hover:text-blue-600"><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => deleteProduct(prod.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        
        {prod.tipoEmbalagem && prod.tipoEmbalagem !== 'nenhuma' && (
          <div className="mt-2 pt-2 border-t border-dashed flex items-center text-xs text-muted-foreground gap-1.5 font-medium">
            <Box className="w-3.5 h-3.5" />
            Emb: {prod.tipoEmbalagem === 'padrao' 
              ? `Padrão (${formatCurrency(settings.taxaEmbalagemGlobal || 0)})` 
              : `Pers. (${formatCurrency(prod.taxaEmbalagem || 0)})`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ProductsTabContent() {
  const { productCategories, products, addProductCategory, deleteProductCategory, addProduct, settings } = useStore()
  
  const [catName, setCatName] = useState("")
  const [prodName, setProdName] = useState("")
  const [prodPrice, setProdPrice] = useState("")
  const [prodCat, setProdCat] = useState("")
  
  const [cobrarEmbalagem, setCobrarEmbalagem] = useState(false)
  const [tipoEmbalagem, setTipoEmbalagem] = useState<"padrao" | "personalizada">("padrao")
  const [taxaEmbalagemProd, setTaxaEmbalagemProd] = useState("")

  const handleAddCategory = () => {
    if (!catName) return
    addProductCategory({ name: catName, isActive: true })
    setCatName("")
  }

  const handleAddProduct = () => {
    if (!prodName || !prodPrice || !prodCat) return
    
    const finalTipo = cobrarEmbalagem ? tipoEmbalagem : "nenhuma"
    const finalTaxa = finalTipo === "personalizada" ? parseFloat(taxaEmbalagemProd.replace(',', '.')) || 0 : 0

    addProduct({ 
      name: prodName, 
      price: parseFloat(prodPrice.replace(',', '.')), 
      categoryId: prodCat, 
      isActive: true,
      tipoEmbalagem: finalTipo,
      taxaEmbalagem: finalTaxa
    })
    
    setProdName("")
    setProdPrice("")
    setCobrarEmbalagem(false)
    setTipoEmbalagem("padrao")
    setTaxaEmbalagemProd("")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Produtos Avulsos</h2>
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
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={prodCat} onValueChange={setProdCat}>
                  <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    {productCategories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Input placeholder="Nome do Produto" value={prodName} onChange={(e) => setProdName(e.target.value)} className="flex-1" />
                <Input type="number" step="0.01" placeholder="Preço (R$)" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className="w-full md:w-[150px]" />
              </div>

              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
                <div className="flex items-center space-x-2 mb-3">
                  <Switch id="cobrar-emb" checked={cobrarEmbalagem} onCheckedChange={setCobrarEmbalagem} />
                  <Label htmlFor="cobrar-emb" className="font-bold cursor-pointer">Cobrar embalagem para este produto?</Label>
                </div>
                
                {cobrarEmbalagem && (
                  <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in zoom-in duration-200">
                    <Select value={tipoEmbalagem} onValueChange={(v: any) => setTipoEmbalagem(v)}>
                      <SelectTrigger className="w-full sm:w-[220px]">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="padrao">Valor Padrão ({formatCurrency(settings.taxaEmbalagemGlobal || 0)})</SelectItem>
                        <SelectItem value="personalizada">Valor Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {tipoEmbalagem === "personalizada" && (
                      <Input type="number" step="0.01" placeholder="Valor Emb. (R$)" value={taxaEmbalagemProd} onChange={(e) => setTaxaEmbalagemProd(e.target.value)} className="w-full sm:w-[150px]" />
                    )}
                  </div>
                )}
              </div>

              <Button onClick={handleAddProduct} className="self-end"><Plus className="h-4 w-4 mr-2"/> Salvar Produto</Button>
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
                      <ProductCard key={prod.id} prod={prod} categories={productCategories} />
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

function SizeCard({ size, onEdit, onDelete }: { size: Size; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="relative hover:shadow-md transition-shadow">
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
        <div className="grid grid-cols-3 gap-3 text-sm mb-3">
          <div className="text-center p-2 bg-muted/50 rounded-lg flex flex-col items-center">
            <div className="font-bold text-lg">{size.maxPastas}</div>
            <div className="text-muted-foreground text-xs mb-1">Massas</div>
            {size.strictMaxPastas ? <div className="flex items-center text-[10px] text-destructive"><Lock className="w-3 h-3 mr-1"/> Fixo</div> : <div className="flex items-center text-[10px] text-green-600"><Unlock className="w-3 h-3 mr-1"/> Extra</div>}
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg flex flex-col items-center">
            <div className="font-bold text-lg">{size.maxIngredients}</div>
            <div className="text-muted-foreground text-xs mb-1">Ingred.</div>
            {size.strictMaxIngredients ? <div className="flex items-center text-[10px] text-destructive"><Lock className="w-3 h-3 mr-1"/> Fixo</div> : <div className="flex items-center text-[10px] text-green-600"><Unlock className="w-3 h-3 mr-1"/> Extra</div>}
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg flex flex-col items-center">
            <div className="font-bold text-lg">{size.maxSauces}</div>
            <div className="text-muted-foreground text-xs mb-1">Molhos</div>
            {size.strictMaxSauces ? <div className="flex items-center text-[10px] text-destructive"><Lock className="w-3 h-3 mr-1"/> Fixo</div> : <div className="flex items-center text-[10px] text-green-600"><Unlock className="w-3 h-3 mr-1"/> Extra</div>}
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 p-2 bg-stone-100 dark:bg-stone-800 rounded text-xs font-bold text-stone-600 dark:text-stone-300">
          <Box className="w-3.5 h-3.5" /> 
          Taxa de Embalagem: {formatCurrency(size.taxaEmbalagem || 0)}
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
    taxaEmbalagem: size?.taxaEmbalagem?.toString() || "0",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: size?.id, name: formData.name, price: parseFloat(formData.price.replace(',', '.')) || 0,
      maxPastas: parseInt(formData.maxPastas) || 1, strictMaxPastas: formData.strictMaxPastas,
      maxIngredients: parseInt(formData.maxIngredients) || 4, strictMaxIngredients: formData.strictMaxIngredients,
      maxSauces: parseInt(formData.maxSauces) || 1, strictMaxSauces: formData.strictMaxSauces,
      taxaEmbalagem: parseFloat(formData.taxaEmbalagem.replace(',', '.')) || 0,
    })
  }

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <CardHeader className="pb-4">
          <CardTitle>{size ? "Editar Tamanho" : "Novo Tamanho"}</CardTitle>
          <CardDescription>Defina os limites e taxas específicas para este tamanho.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Nome do Tamanho</Label>
              <Input placeholder='Ex: "G (400g)"' value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Preço Base (R$)</Label>
              <Input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Valor da Embalagem (R$)</Label>
              <Input type="number" step="0.01" min="0" value={formData.taxaEmbalagem} onChange={(e) => setFormData({ ...formData, taxaEmbalagem: e.target.value })} required />
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

function RulesTabContent() {
  const { sizes, addSize, updateSize, deleteSize, settings, updateSettings } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)
  const [editingLimits, setEditingLimits] = useState(false)
  const [limitData, setLimitData] = useState({
    extraPastaPrice: (settings.extraPastaPrice || 0).toString(),
    extraSaucePrice: (settings.extraSaucePrice || 0).toString(),
    extraIngredientPrice: (settings.extraIngredientPrice || 0).toString(),
  })

  const handleSaveSize = (data: Omit<Size, 'id'> & { id?: string }) => {
    if (data.id) updateSize(data.id, data)
    else addSize({ ...data, id: `size-${Date.now()}` })
    setShowForm(false)
    setEditingSize(null)
  }

  const handleSaveLimits = () => {
    updateSettings({ 
      extraPastaPrice: parseFloat(limitData.extraPastaPrice.replace(',', '.')) || 0,
      extraSaucePrice: parseFloat(limitData.extraSaucePrice.replace(',', '.')) || 0,
      extraIngredientPrice: parseFloat(limitData.extraIngredientPrice.replace(',', '.')) || 0,
    })
    setEditingLimits(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tamanhos e Regras</h2>
          <p className="text-muted-foreground mt-1">Configure os tamanhos de macarrão e os valores cobrados por excesso.</p>
        </div>
        {!showForm && <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Novo Tamanho</Button>}
      </div>

      <Card className="mb-6 border-orange-100 dark:border-orange-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Valores de Limites Extras</CardTitle>
              <CardDescription>Taxa cobrada quando o cliente ultrapassa a quantidade limite.</CardDescription>
            </div>
            {!editingLimits && <Button variant="outline" size="sm" onClick={() => setEditingLimits(true)}><Pencil className="h-4 w-4 mr-2" /> Editar</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {editingLimits ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2"><Label>Extra por Massa (R$)</Label><Input type="number" step="0.01" value={limitData.extraPastaPrice} onChange={(e) => setLimitData({ ...limitData, extraPastaPrice: e.target.value })} /></div>
                <div className="space-y-2"><Label>Extra por Molho (R$)</Label><Input type="number" step="0.01" value={limitData.extraSaucePrice} onChange={(e) => setLimitData({ ...limitData, extraSaucePrice: e.target.value })} /></div>
                <div className="space-y-2"><Label>Extra por Ingred. (R$)</Label><Input type="number" step="0.01" value={limitData.extraIngredientPrice} onChange={(e) => setLimitData({ ...limitData, extraIngredientPrice: e.target.value })} /></div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveLimits}><Save className="h-4 w-4 mr-2" /> Salvar</Button>
                <Button variant="outline" onClick={() => setEditingLimits(false)}><X className="h-4 w-4 mr-2" /> Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/50">
                <div className="text-sm text-muted-foreground">Massa Extra</div>
                <div className="text-xl font-bold text-primary">{formatCurrency(settings.extraPastaPrice || 0)}</div>
              </div>
              <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/50">
                <div className="text-sm text-muted-foreground">Molho Extra</div>
                <div className="text-xl font-bold text-primary">{formatCurrency(settings.extraSaucePrice || 0)}</div>
              </div>
              <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/50">
                <div className="text-sm text-muted-foreground">Ingrediente Extra</div>
                <div className="text-xl font-bold text-primary">{formatCurrency(settings.extraIngredientPrice || 0)}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && <SizeForm size={editingSize || undefined} onSave={handleSaveSize} onCancel={() => { setShowForm(false); setEditingSize(null) }} />}

      <div>
        <h2 className="text-xl font-semibold mb-4">Tamanhos Disponíveis</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sizes.map((size) => (
            <SizeCard key={size.id} size={size} onEdit={() => { setEditingSize(size); setShowForm(true) }} onDelete={() => deleteSize(size.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function OperationsTabContent() {
  const { settings, updateSettings } = useStore()
  const [localWhatsappMsg, setLocalWhatsappMsg] = useState(settings.whatsappMessage || "")
  const [globalTax, setGlobalTax] = useState(settings.taxaEmbalagemGlobal?.toString() || "0")

  useEffect(() => {
    setLocalWhatsappMsg(settings.whatsappMessage || "")
    setGlobalTax(settings.taxaEmbalagemGlobal?.toString() || "0")
  }, [settings])

  const handleMsgBlur = () => {
    if (localWhatsappMsg !== settings.whatsappMessage) {
      updateSettings({ whatsappMessage: localWhatsappMsg })
    }
  }

  const handleSaveGlobalTax = () => {
    updateSettings({ taxaEmbalagemGlobal: parseFloat(globalTax.replace(',', '.')) || 0 })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configurações de Operação</h2>
        <p className="text-muted-foreground mt-1">Gerencie regras gerais, aprovação automática e valores padrões.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taxa Padrão de Embalagem</CardTitle>
            <CardDescription>Valor cobrado ao utilizar a opção "Valor Padrão" em produtos avulsos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input type="number" step="0.01" value={globalTax} onChange={(e) => setGlobalTax(e.target.value)} className="w-full" placeholder="Ex: 2.00" />
              <Button onClick={handleSaveGlobalTax}><Save className="w-4 h-4 mr-2" /> Salvar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aprovação Automática</CardTitle>
            <CardDescription>Pular a aba "Aguardando" e enviar pedidos direto para preparo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 bg-muted/50 p-4 rounded-lg border">
              <Switch checked={settings.autoApprove} onCheckedChange={(val) => updateSettings({ autoApprove: val })} className="data-[state=checked]:bg-orange-600" />
              <Label className="font-bold cursor-pointer text-base">
                {settings.autoApprove ? "LIGADA (Envio direto)" : "DESLIGADA (Aprovação manual)"}
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Template do WhatsApp</CardTitle>
          <CardDescription>
            Use as tags: <code>{"{{nome}}"}</code>, <code>{"{{pedido}}"}</code>, <code>{"{{total}}"}</code>, <code>{"{{status}}"}</code>, e <code>{"{{link}}"}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            className="resize-y min-h-[120px] shadow-sm" 
            value={localWhatsappMsg} 
            onChange={(e) => setLocalWhatsappMsg(e.target.value)} 
            onBlur={handleMsgBlur} 
            placeholder="Ex: Olá {{nome}}, seu pedido:\n{{pedido}}\nNo valor de {{total}} está {{status}}!\nAcompanhe: {{link}}" 
          />
          <p className="text-xs text-muted-foreground text-right mt-2">Salvo automaticamente ao clicar fora da caixa.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function UnifiedMenuPage() {
  return (
    <div className="container max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-stone-800 dark:text-stone-100 tracking-tight">Gestão do Cardápio</h1>
        <p className="text-stone-500 font-medium mt-1">Gerencie ingredientes, produtos avulsos, regras de tamanho e configuração da loja.</p>
      </div>

      <Tabs defaultValue="cardapio" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full bg-stone-200/50 p-1 rounded-xl h-auto gap-1">
          <TabsTrigger value="cardapio" className="rounded-lg font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white whitespace-normal h-12">
            <UtensilsCrossed className="w-4 h-4 mr-1 md:mr-2" /> Ingredientes
          </TabsTrigger>
          <TabsTrigger value="produtos" className="rounded-lg font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-normal h-12">
            <PackageOpen className="w-4 h-4 mr-1 md:mr-2" /> Produtos
          </TabsTrigger>
          <TabsTrigger value="regras" className="rounded-lg font-bold data-[state=active]:bg-stone-800 data-[state=active]:text-white whitespace-normal h-12">
            <Box className="w-4 h-4 mr-1 md:mr-2" /> Regras
          </TabsTrigger>
          <TabsTrigger value="operacao" className="rounded-lg font-bold data-[state=active]:bg-green-600 data-[state=active]:text-white whitespace-normal h-12">
            <Settings2 className="w-4 h-4 mr-1 md:mr-2" /> Operação
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 p-6 min-h-[60vh]">
          <TabsContent value="cardapio" className="m-0 focus-visible:outline-none"><MenuTabContent /></TabsContent>
          <TabsContent value="produtos" className="m-0 focus-visible:outline-none"><ProductsTabContent /></TabsContent>
          <TabsContent value="regras" className="m-0 focus-visible:outline-none"><RulesTabContent /></TabsContent>
          <TabsContent value="operacao" className="m-0 focus-visible:outline-none"><OperationsTabContent /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}