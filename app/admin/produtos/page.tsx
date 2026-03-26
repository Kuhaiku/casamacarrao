// app/admin/produtos/page.tsx
"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

export default function AdminProductsPage() {
  const { productCategories, products, addProductCategory, deleteProductCategory, addProduct, toggleProductActive, deleteProduct } = useStore()
  
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
    addProduct({ name: prodName, price: parseFloat(prodPrice), categoryId: prodCat, isActive: true })
    setProdName("")
    setProdPrice("")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Produtos Adicionais</h1>
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
                      <Card key={prod.id} className={prod.isActive ? "" : "opacity-50"}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{prod.name}</p>
                            <p className="text-sm text-primary font-bold">R$ {prod.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch checked={prod.isActive} onCheckedChange={() => toggleProductActive(prod.id)} />
                            <Button variant="ghost" size="icon" onClick={() => deleteProduct(prod.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
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