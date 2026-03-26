// app/admin/financeiro/page.tsx
"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, DollarSign, TrendingDown, HeartHandshake, LockKeyhole } from "lucide-react"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function FinanceiroPage() {
  const { 
    orders, expenses, tips, cashRegisters, registerOpenedAt, 
    addExpense, deleteExpense, addTip, deleteTip, closeRegister 
  } = useStore()

  const [desc, setDesc] = useState("")
  const [amount, setAmount] = useState("")

  // Filtra apenas dados do caixa atual (não contabilizados)
  const currentOrders = orders.filter(o => !o.isAccounted && o.isPaid)
  const currentExpenses = expenses.filter(e => !e.isAccounted)
  const currentTips = tips.filter(t => !t.isAccounted)

  const totalSales = currentOrders.reduce((acc, o) => acc + o.total, 0)
  const totalExpenses = currentExpenses.reduce((acc, e) => acc + e.amount, 0)
  const totalTips = currentTips.reduce((acc, t) => acc + t.amount, 0)
  const netTotal = (totalSales + totalTips) - totalExpenses

  const handleAddEntry = (type: 'expense' | 'tip') => {
    if (!desc || !amount) return
    const value = parseFloat(amount)
    if (type === 'expense') addExpense({ description: desc, amount: value })
    else addTip({ description: desc, amount: value })
    setDesc("")
    setAmount("")
  }

  const handleCloseRegister = () => {
    if (confirm("Tem certeza que deseja fechar o caixa? Isso vai arquivar os registros atuais.")) {
      closeRegister()
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestão Financeira</h1>
        <p className="text-muted-foreground mt-1">Controle de caixa, despesas e gorjetas.</p>
      </div>

      <Tabs defaultValue="atual" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="atual">Caixa Atual</TabsTrigger>
          <TabsTrigger value="historico">Histórico Fechado</TabsTrigger>
        </TabsList>

        <TabsContent value="atual" className="space-y-6 mt-6">
          {/* RESUMO DO CAIXA ATUAL */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Vendas (Pagas)</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</div>
                <p className="text-xs text-muted-foreground">{currentOrders.length} pedidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gorjetas</CardTitle>
                <HeartHandshake className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalTips)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">-{formatCurrency(totalExpenses)}</div>
              </CardContent>
            </Card>
            <Card className={netTotal >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Líquido do Caixa</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(netTotal)}</div>
                <p className="text-xs text-muted-foreground">
                  Aberto em: {new Date(registerOpenedAt).toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCloseRegister} variant="default" className="bg-primary text-primary-foreground">
              <LockKeyhole className="mr-2 h-4 w-4" /> Fechar Caixa Agora
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Lançamentos de Despesas */}
            <Card>
              <CardHeader>
                <CardTitle>Lançar Despesa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Ex: Gás, Embalagens..." value={desc} onChange={(e) => setDesc(e.target.value)} />
                  <Input type="number" placeholder="R$ 0,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-32" />
                  <Button variant="destructive" onClick={() => handleAddEntry('expense')}>Adicionar</Button>
                </div>
                <div className="space-y-2 mt-4">
                  {currentExpenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50 border">
                      <span className="text-sm">{exp.description}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-destructive">-{formatCurrency(exp.amount)}</span>
                        <Button variant="ghost" size="icon" onClick={() => deleteExpense(exp.id)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/></Button>
                      </div>
                    </div>
                  ))}
                  {currentExpenses.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhuma despesa no caixa atual.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Lançamentos de Gorjetas */}
            <Card>
              <CardHeader>
                <CardTitle>Lançar Gorjeta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Ex: Caixinha do balcão..." value={desc} onChange={(e) => setDesc(e.target.value)} />
                  <Input type="number" placeholder="R$ 0,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-32" />
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleAddEntry('tip')}>Adicionar</Button>
                </div>
                <div className="space-y-2 mt-4">
                  {currentTips.map(tip => (
                    <div key={tip.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50 border">
                      <span className="text-sm">{tip.description}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-blue-600">+{formatCurrency(tip.amount)}</span>
                        <Button variant="ghost" size="icon" onClick={() => deleteTip(tip.id)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/></Button>
                      </div>
                    </div>
                  ))}
                  {currentTips.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhuma gorjeta no caixa atual.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Caixas Fechados</CardTitle>
              <CardDescription>Resumo dos últimos fechamentos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cashRegisters.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum caixa fechado ainda.</p>
                ) : (
                  cashRegisters.map(reg => (
                    <div key={reg.id} className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 border rounded-lg items-center">
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-xs text-muted-foreground">Abertura</p>
                        <p className="text-sm font-medium">{new Date(reg.openedAt).toLocaleDateString('pt-BR')} {new Date(reg.openedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                        <p className="text-xs text-muted-foreground mt-1">Fechamento</p>
                        <p className="text-sm font-medium">{new Date(reg.closedAt).toLocaleDateString('pt-BR')} {new Date(reg.closedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vendas ({reg.orderCount})</p>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(reg.totalSales)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gorjetas</p>
                        <p className="text-sm font-bold text-blue-600">{formatCurrency(reg.totalTips)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Despesas</p>
                        <p className="text-sm font-bold text-destructive">-{formatCurrency(reg.totalExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Líquido</p>
                        <p className="text-lg font-bold">{formatCurrency(reg.netTotal)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}