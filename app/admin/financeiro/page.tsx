// app/admin/financeiro/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { verifyFinanceiroPassword } from "@/lib/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Trash2, DollarSign, TrendingDown, HeartHandshake, LockKeyhole, 
  ShieldCheck, ArrowRightLeft, Wallet, AlertCircle, Eye, EyeOff
} from "lucide-react"
import { toast } from "sonner"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function FinanceiroPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authPassword, setAuthPassword] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const { 
    orders, expenses, tips, cashRegisters, registerOpenedAt, 
    addExpense, deleteExpense, addTip, deleteTip, closeRegister 
  } = useStore()

  const [expenseDesc, setExpenseDesc] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [tipDesc, setTipDesc] = useState("")
  const [tipAmount, setTipAmount] = useState("")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  // Processamento Seguro (só renderiza o layout após a senha)
  const currentOrders = orders.filter(o => !o.isAccounted && o.isPaid)
  const currentExpenses = expenses.filter(e => !e.isAccounted)
  const currentTips = tips.filter(t => !t.isAccounted)

  const totalSales = currentOrders.reduce((acc, o) => acc + o.total, 0)
  const totalExpenses = currentExpenses.reduce((acc, e) => acc + e.amount, 0)
  const totalTips = currentTips.reduce((acc, t) => acc + t.amount, 0)
  const netTotal = (totalSales + totalTips) - totalExpenses

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthenticating(true)
    try {
      const valid = await verifyFinanceiroPassword(authPassword)
      if (valid) {
        setIsAuthenticated(true)
        toast.success("Acesso Liberado")
      } else {
        toast.error("Senha incorreta.")
      }
    } catch (error) {
      toast.error("Erro ao processar senha.")
    } finally {
      setIsAuthenticating(false)
      setAuthPassword("")
    }
  }

  const handleAddEntry = (type: 'expense' | 'tip') => {
    if (type === 'expense') {
      if (!expenseDesc || !expenseAmount) return
      addExpense({ description: expenseDesc, amount: parseFloat(expenseAmount) })
      setExpenseDesc(""); setExpenseAmount("")
      toast.success("Despesa adicionada")
    } else {
      if (!tipDesc || !tipAmount) return
      addTip({ description: tipDesc, amount: parseFloat(tipAmount) })
      setTipDesc(""); setTipAmount("")
      toast.success("Gorjeta adicionada")
    }
  }

  const handleCloseRegister = () => {
    if (confirm("Tem certeza que deseja fechar o caixa? Todos os registros atuais serão arquivados e zerados.")) {
      closeRegister()
      toast.success("Caixa fechado com sucesso.")
    }
  }

  // TELA DE BLOQUEIO
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in zoom-in-95 duration-500">
        <Card className="w-full max-w-md shadow-2xl border-stone-200">
          <form onSubmit={handleLogin}>
            <CardHeader className="text-center space-y-2 pb-6 pt-8 bg-stone-50 rounded-t-xl border-b">
              <div className="mx-auto bg-stone-200 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                <ShieldCheck className="w-8 h-8 text-stone-600" />
              </div>
              <CardTitle className="text-2xl font-black text-stone-800">Acesso Restrito</CardTitle>
              <CardDescription className="text-base">Módulo Financeiro Exclusivo</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-8 space-y-4 px-8">
              <div className="space-y-2">
                <Input 
                  type="password" 
                  placeholder="Digite a senha financeira" 
                  className="h-12 text-center text-lg tracking-widest"
                  autoFocus 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)} 
                />
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-bold bg-stone-800 hover:bg-stone-900" disabled={isAuthenticating}>
                {isAuthenticating ? "Verificando..." : "Desbloquear Acesso"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    )
  }

  // TELA DO FINANCEIRO (Desbloqueada)
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-3xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-green-600" /> Cofre Financeiro
          </h1>
          <p className="text-stone-500 font-medium mt-1">Transparência e controle absoluto sobre o fluxo de caixa.</p>
        </div>
        <Button onClick={() => setIsAuthenticated(false)} variant="outline" className="font-bold border-stone-300">
          <LockKeyhole className="w-4 h-4 mr-2" /> Bloquear Tela
        </Button>
      </div>

      <Tabs defaultValue="atual" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-stone-200/50 p-1 rounded-xl h-12">
          <TabsTrigger value="atual" className="rounded-lg font-bold data-[state=active]:bg-stone-800 data-[state=active]:text-white">Caixa do Turno</TabsTrigger>
          <TabsTrigger value="historico" className="rounded-lg font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Relatórios Fechados</TabsTrigger>
        </TabsList>

        <TabsContent value="atual" className="space-y-6 mt-6 focus-visible:outline-none">
          
          {/* CARDS DE RESUMO */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-green-200 bg-green-50/30">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-stone-600">Vendas Recebidas</CardTitle>
                <div className="bg-green-100 p-2 rounded-full"><DollarSign className="h-4 w-4 text-green-700" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-green-700">{formatCurrency(totalSales)}</div>
                <p className="text-sm font-medium text-green-600/70 mt-1">{currentOrders.length} pedidos pagos</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-stone-600">Gorjetas / Extras</CardTitle>
                <div className="bg-blue-100 p-2 rounded-full"><HeartHandshake className="h-4 w-4 text-blue-700" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-blue-700">{formatCurrency(totalTips)}</div>
                <p className="text-sm font-medium text-blue-600/70 mt-1">{currentTips.length} entradas</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/30">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-stone-600">Despesas / Saídas</CardTitle>
                <div className="bg-red-100 p-2 rounded-full"><TrendingDown className="h-4 w-4 text-red-700" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-red-700">-{formatCurrency(totalExpenses)}</div>
                <p className="text-sm font-medium text-red-600/70 mt-1">{currentExpenses.length} lançamentos</p>
              </CardContent>
            </Card>

            <Card className={`border-2 ${netTotal >= 0 ? 'border-stone-800 bg-stone-900 text-white' : 'border-red-800 bg-red-900 text-white'}`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-stone-300">Saldo Líquido</CardTitle>
                <div className="bg-white/20 p-2 rounded-full"><Wallet className="h-4 w-4 text-white" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black">{formatCurrency(netTotal)}</div>
                <p className="text-xs font-medium text-stone-400 mt-2">
                  Aberto em: {registerOpenedAt ? new Date(registerOpenedAt).toLocaleString('pt-BR') : 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            
            {/* PAINEL DE DESPESAS */}
            <Card className="shadow-sm border-stone-200">
              <CardHeader className="bg-stone-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-600"/> Lançamentos de Despesa</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 bg-stone-50 border-b flex gap-2">
                  <Input placeholder="Descrição da Saída" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="bg-white" />
                  <Input type="number" placeholder="R$ 0,00" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-32 bg-white" />
                  <Button variant="destructive" onClick={() => handleAddEntry('expense')} className="font-bold">Lançar</Button>
                </div>
                <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                  {currentExpenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center p-3 rounded-xl bg-white border shadow-sm group hover:border-red-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown className="w-4 h-4"/></div>
                        <span className="font-medium text-stone-700">{exp.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-red-600 text-lg">-{formatCurrency(exp.amount)}</span>
                        <Button variant="ghost" size="icon" onClick={() => deleteExpense(exp.id)} className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </div>
                  ))}
                  {currentExpenses.length === 0 && (
                    <div className="text-center py-10 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed rounded-xl">
                      <ShieldCheck className="w-10 h-10 mb-2 opacity-20" />
                      <p className="font-medium">Nenhuma despesa registrada.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PAINEL DE GORJETAS */}
            <Card className="shadow-sm border-stone-200">
              <CardHeader className="bg-stone-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2"><HeartHandshake className="w-5 h-5 text-blue-600"/> Lançamentos de Gorjeta</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 bg-stone-50 border-b flex gap-2">
                  <Input placeholder="Origem da Gorjeta" value={tipDesc} onChange={(e) => setTipDesc(e.target.value)} className="bg-white" />
                  <Input type="number" placeholder="R$ 0,00" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} className="w-32 bg-white" />
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => handleAddEntry('tip')}>Lançar</Button>
                </div>
                <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                  {currentTips.map(tip => (
                    <div key={tip.id} className="flex justify-between items-center p-3 rounded-xl bg-white border shadow-sm group hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><HeartHandshake className="w-4 h-4"/></div>
                        <span className="font-medium text-stone-700">{tip.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-blue-600 text-lg">+{formatCurrency(tip.amount)}</span>
                        <Button variant="ghost" size="icon" onClick={() => deleteTip(tip.id)} className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </div>
                  ))}
                  {currentTips.length === 0 && (
                    <div className="text-center py-10 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed rounded-xl">
                      <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                      <p className="font-medium">Nenhuma gorjeta recebida.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleCloseRegister} className="bg-stone-800 hover:bg-stone-900 text-white font-bold h-14 px-8 text-lg rounded-xl shadow-lg hover:scale-105 transition-transform">
              <LockKeyhole className="mr-2 h-5 w-5" /> Fechar e Arquivar Caixa do Turno
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-6 focus-visible:outline-none">
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-4">
              {cashRegisters.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-stone-300 text-stone-400">
                  <p className="font-bold text-lg">Histórico Vazio</p>
                  <p>Nenhum caixa foi fechado até o momento.</p>
                </div>
              ) : (
                cashRegisters.map(reg => (
                  <Card key={reg.id} className="overflow-hidden border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row">
                      <div className="bg-stone-50 p-4 lg:w-64 border-b lg:border-b-0 lg:border-r border-stone-200 flex flex-col justify-center">
                        <div className="mb-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Abertura</p>
                          <p className="font-bold text-stone-700">{new Date(reg.openedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Fechamento</p>
                          <p className="font-bold text-stone-700">{new Date(reg.closedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                      </div>
                      <div className="p-4 flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="text-xs font-bold text-stone-500 mb-1 flex items-center gap-1"><Wallet className="w-3 h-3"/> Vendas Brutas</p>
                          <p className="text-xl font-black text-stone-800">{formatCurrency(reg.totalSales)}</p>
                          <p className="text-xs font-medium text-stone-400">{reg.orderCount} pedidos</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1"><HeartHandshake className="w-3 h-3"/> Gorjetas</p>
                          <p className="text-xl font-black text-blue-700">+{formatCurrency(reg.totalTips)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Despesas</p>
                          <p className="text-xl font-black text-red-700">-{formatCurrency(reg.totalExpenses)}</p>
                        </div>
                        <div className="bg-stone-800 p-3 rounded-xl text-center shadow-inner text-white">
                          <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-0.5">Líquido Retido</p>
                          <p className="text-2xl font-black">{formatCurrency(reg.netTotal)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}