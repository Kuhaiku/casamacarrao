// app/admin/financeiro/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { verifyFinanceiroPassword } from "@/lib/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  DollarSign,
  TrendingDown,
  HeartHandshake,
  LockKeyhole,
  ShieldCheck,
  Wallet,
  AlertCircle,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  MapPin,
  Motorbike,
  Check,
  Utensils,
  LayoutList
} from "lucide-react";
import { toast } from "sonner";

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ajustarFusoHorario(dateString?: string) {
  if (!dateString) return "N/A";
  try {
    let isoString = dateString.replace(" ", "T");
    if (!isoString.includes("Z") && !isoString.match(/[+-]\d{2}:?\d{2}$/)) {
      isoString += "Z"; // Força a interpretação como UTC
    }
    const date = new Date(isoString);
    
    // Formata cravado no horário do Brasil
    return date.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Data inválida";
  }
}

function getOrderType(address: string) {
  if (!address) return "ENTREGA";
  const trimmed = address.trim().toLowerCase();
  const isMesa = trimmed.startsWith("mesa") || /^\d+$/.test(trimmed);
  return isMesa ? "LOCAL" : "ENTREGA";
}

export default function FinanceiroPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const [expandedReg, setExpandedReg] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"TUDO" | "LOCAL" | "ENTREGA">("TUDO");
  const [selectedBairros, setSelectedBairros] = useState<string[]>([]);

  const {
    orders,
    expenses,
    tips,
    cashRegisters,
    registerOpenedAt,
    addExpense,
    deleteExpense,
    addTip,
    deleteTip,
    closeRegister,
    sync,
  } = useStore();

  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [tipDesc, setTipDesc] = useState("");
  const [tipAmount, setTipAmount] = useState("");

  useEffect(() => {
    setIsMounted(true);
    sync();
  }, [sync]);

  if (!isMounted) return null;

  const currentOrders = orders.filter((o) => !o.isAccounted && o.isPaid && o.status !== "cancelado");
  const currentExpenses = expenses.filter((e) => !e.isAccounted);
  const currentTips = tips.filter((t) => !t.isAccounted);

  const totalSales = currentOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  const totalExpenses = currentExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const totalTips = currentTips.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const netTotal = totalSales + totalTips - totalExpenses;

  // Lógica da Aba "Entregas do Turno"
  const deliveryOrders = currentOrders.filter((o) => getOrderType(o.address) === "ENTREGA");

  const getBairro = (address: string) => {
    const parts = address.split('-');
    if (parts.length > 1) {
      const afterDash = parts[1].split(',')[0].trim();
      return afterDash || "Não Identificado";
    }
    return "Não Identificado";
  };

  const bairrosDisponiveis = Array.from(new Set(deliveryOrders.map(o => getBairro(o.address)))).sort();

  const filteredDeliveries = deliveryOrders.filter(o => 
    selectedBairros.length === 0 || selectedBairros.includes(getBairro(o.address))
  );

  const toggleBairro = (bairro: string) => {
    if (selectedBairros.includes(bairro)) {
      setSelectedBairros(selectedBairros.filter(b => b !== bairro));
    } else {
      setSelectedBairros([...selectedBairros, bairro]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      const valid = await verifyFinanceiroPassword(authPassword);
      if (valid) {
        setIsAuthenticated(true);
        toast.success("Acesso Liberado");
      } else {
        toast.error("Senha incorreta.");
      }
    } catch (error) {
      toast.error("Erro ao processar senha.");
    } finally {
      setIsAuthenticating(false);
      setAuthPassword("");
    }
  };

  const handleAddEntry = (type: "expense" | "tip") => {
    if (type === "expense") {
      if (!expenseDesc || !expenseAmount) return;
      addExpense({
        description: expenseDesc,
        amount: parseFloat(expenseAmount.replace(",", ".")),
      });
      setExpenseDesc("");
      setExpenseAmount("");
      toast.success("Despesa adicionada");
    } else {
      if (!tipDesc || !tipAmount) return;
      addTip({
        description: tipDesc,
        amount: parseFloat(tipAmount.replace(",", ".")),
      });
      setTipDesc("");
      setTipAmount("");
      toast.success("Gorjeta adicionada");
    }
  };

  const handleCloseRegister = () => {
    if (confirm("Tem certeza que deseja fechar o caixa? Todos os registros atuais serão arquivados e zerados.")) {
      closeRegister();
      toast.success("Caixa fechado com sucesso.");
    }
  };

  const handleExpandReg = (id: string) => {
    if (expandedReg === id) {
      setExpandedReg(null);
    } else {
      setExpandedReg(id);
      setHistoryFilter("TUDO"); // Reseta o filtro ao abrir um novo relatório
    }
  };

  // TABELA GERAL
  const renderOrdersTable = (listaPedidos: any[]) => (
    <div className="max-h-[500px] overflow-y-auto">
      <Table>
        <TableHeader className="bg-stone-50 sticky top-0 shadow-sm z-10">
          <TableRow>
            <TableHead className="w-[140px]">Data e Hora</TableHead>
            <TableHead>Cliente / Endereço</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listaPedidos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10 text-stone-400 font-medium border-b-0 bg-white">
                Nenhuma venda encontrada para este filtro.
              </TableCell>
            </TableRow>
          ) : (
            listaPedidos
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((order) => {
                const isMesa = getOrderType(order.address) === "LOCAL";
                return (
                  <TableRow key={order.id} className="hover:bg-stone-50/50 bg-white">
                    <TableCell className="text-xs text-stone-500 font-medium">
                      {ajustarFusoHorario(order.createdAt)}
                    </TableCell>
                    <TableCell className="font-bold text-stone-800">
                      {order.customerName}
                      <div className="text-xs font-normal text-stone-500 truncate max-w-[300px]" title={order.address}>
                        {order.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={isMesa ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}>
                        {isMesa ? "Local / Mesa" : "Delivery"}
                      </Badge>
                    </TableCell>
                    <TableCell className="uppercase text-xs font-bold text-stone-600">
                      {order.paymentMethod}
                    </TableCell>
                    <TableCell className="text-right font-black text-green-600 text-base">
                      {formatCurrency(order.total)}
                    </TableCell>
                  </TableRow>
                );
              })
          )}
        </TableBody>
      </Table>
    </div>
  );

  // TABELA EXCLUSIVA DE ENTREGAS
  const renderDeliveryClosureTable = (listaEntregas: any[]) => (
    <div className="max-h-[500px] overflow-y-auto">
      <Table>
        <TableHeader className="bg-purple-50 sticky top-0 shadow-sm z-10">
          <TableRow>
            <TableHead className="w-[140px] text-purple-900 font-bold">Data/Hora</TableHead>
            <TableHead className="text-purple-900 font-bold">Cliente</TableHead>
            <TableHead className="text-purple-900 font-bold">Origem</TableHead>
            <TableHead className="text-purple-900 font-bold">Endereço</TableHead>
            <TableHead className="text-purple-900 font-bold">Bairro</TableHead>
            <TableHead className="text-right text-purple-900 font-bold">Entrega (Taxa)</TableHead>
            <TableHead className="text-right text-purple-900 font-bold">Total Líquido</TableHead>
            <TableHead className="text-right text-purple-900 font-bold">Total Bruto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listaEntregas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-stone-400 font-medium border-b-0 bg-white">
                Nenhuma entrega registrada neste fechamento.
              </TableCell>
            </TableRow>
          ) : (
            listaEntregas
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((order) => {
                const taxaEntrega = Number(order.taxaEntrega) || 0;
                const totalBruto = Number(order.total) || 0;
                const totalLiquido = totalBruto - taxaEntrega;
                const bairro = getBairro(order.address);

                return (
                  <TableRow key={order.id} className="hover:bg-stone-50/50 bg-white">
                    <TableCell className="text-xs text-stone-500 font-medium">{ajustarFusoHorario(order.createdAt)}</TableCell>
                    <TableCell className="font-bold text-stone-800">{order.customerName}</TableCell>
                    <TableCell className="uppercase text-xs font-bold text-stone-600">{order.paymentMethod}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate" title={order.address}>{order.address}</TableCell>
                    <TableCell className="text-xs font-bold text-stone-600">{bairro}</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">{formatCurrency(taxaEntrega)}</TableCell>
                    <TableCell className="text-right font-bold text-stone-600">{formatCurrency(totalLiquido)}</TableCell>
                    <TableCell className="text-right font-black text-green-600 text-base">{formatCurrency(totalBruto)}</TableCell>
                  </TableRow>
                );
              })
          )}
        </TableBody>
      </Table>
    </div>
  );

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
              <Input
                type="password"
                placeholder="Digite a senha financeira"
                className="h-12 text-center text-lg tracking-widest"
                autoFocus
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
              <Button type="submit" className="w-full h-12 text-lg font-bold bg-stone-800 hover:bg-stone-900" disabled={isAuthenticating}>
                {isAuthenticating ? "Verificando..." : "Desbloquear Acesso"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-3xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-green-600" /> Cofre Financeiro
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            Transparência e controle absoluto sobre o fluxo de caixa.
          </p>
        </div>
        <Button onClick={() => setIsAuthenticated(false)} variant="outline" className="font-bold border-stone-300">
          <LockKeyhole className="w-4 h-4 mr-2" /> Bloquear Tela
        </Button>
      </div>

      <Tabs defaultValue="atual" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-3 bg-stone-200/50 p-1 rounded-xl h-12">
          <TabsTrigger value="atual" className="rounded-lg font-bold data-[state=active]:bg-stone-800 data-[state=active]:text-white">
            Caixa do Turno
          </TabsTrigger>
          <TabsTrigger value="entregas" className="rounded-lg font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            Entregas do Turno
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-lg font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Relatórios Fechados
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: CAIXA DO TURNO */}
        <TabsContent value="atual" className="space-y-6 mt-6 focus-visible:outline-none">
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
            <Card className={`border-2 ${netTotal >= 0 ? "border-stone-800 bg-stone-900 text-white" : "border-red-800 bg-red-900 text-white"}`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-stone-300">Saldo Líquido</CardTitle>
                <div className="bg-white/20 p-2 rounded-full"><Wallet className="h-4 w-4 text-white" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black">{formatCurrency(netTotal)}</div>
                <p className="text-xs font-medium text-stone-400 mt-2">Aberto em: {ajustarFusoHorario(registerOpenedAt)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm border-stone-200">
              <CardHeader className="bg-stone-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" /> Lançamentos de Despesa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 bg-stone-50 border-b flex gap-2">
                  <Input placeholder="Descrição da Saída" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="bg-white" />
                  <Input type="number" step="0.01" placeholder="R$ 0,00" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-32 bg-white" />
                  <Button variant="destructive" onClick={() => handleAddEntry("expense")} className="font-bold">Lançar</Button>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-4 space-y-2">
                  {currentExpenses.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center p-3 rounded-xl bg-white border shadow-sm group hover:border-red-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown className="w-4 h-4" /></div>
                        <span className="font-medium text-stone-700">{exp.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-red-600 text-lg">-{formatCurrency(exp.amount)}</span>
                        <Button variant="ghost" size="icon" onClick={() => deleteExpense(exp.id)} className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-stone-200">
              <CardHeader className="bg-stone-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-blue-600" /> Lançamentos de Gorjeta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 bg-stone-50 border-b flex gap-2">
                  <Input placeholder="Origem da Gorjeta" value={tipDesc} onChange={(e) => setTipDesc(e.target.value)} className="bg-white" />
                  <Input type="number" step="0.01" placeholder="R$ 0,00" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} className="w-32 bg-white" />
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => handleAddEntry("tip")}>Lançar</Button>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-4 space-y-2">
                  {currentTips.map((tip) => (
                    <div key={tip.id} className="flex justify-between items-center p-3 rounded-xl bg-white border shadow-sm group hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><HeartHandshake className="w-4 h-4" /></div>
                        <span className="font-medium text-stone-700">{tip.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-blue-600 text-lg">+{formatCurrency(tip.amount)}</span>
                        <Button variant="ghost" size="icon" onClick={() => deleteTip(tip.id)} className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="col-span-full border-stone-200 shadow-sm mt-6">
            <CardHeader className="bg-stone-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-stone-600" /> Detalhamento de Vendas do Turno
              </CardTitle>
              <CardDescription>Histórico completo de todos os pedidos pagos.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {renderOrdersTable(currentOrders)}
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button onClick={handleCloseRegister} className="bg-stone-800 hover:bg-stone-900 text-white font-bold h-14 px-8 text-lg rounded-xl shadow-lg hover:scale-105 transition-transform">
              <LockKeyhole className="mr-2 h-5 w-5" /> Fechar e Arquivar Caixa do Turno
            </Button>
          </div>
        </TabsContent>

        {/* ABA 2: ENTREGAS DO TURNO */}
        <TabsContent value="entregas" className="mt-6 focus-visible:outline-none space-y-6">
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="bg-purple-50 border-b border-purple-100">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                    <Motorbike className="w-6 h-6 text-purple-600" /> Painel de Entregas (Motoboys)
                  </CardTitle>
                  <CardDescription className="text-purple-700/70 mt-1">
                    Visualize os totais de taxas e pedidos baseados nos bairros.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <h4 className="text-sm font-bold text-stone-600 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Filtrar por Bairros:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {bairrosDisponiveis.length === 0 && (
                    <span className="text-sm text-stone-400 italic">Nenhum bairro registrado ainda no turno.</span>
                  )}
                  {bairrosDisponiveis.map(bairro => (
                    <button
                      key={bairro}
                      onClick={() => toggleBairro(bairro)}
                      className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all flex items-center gap-2
                        ${selectedBairros.includes(bairro) 
                          ? "border-purple-600 bg-purple-600 text-white shadow-md" 
                          : "border-stone-200 bg-white text-stone-600 hover:border-purple-300"}`}
                    >
                      {bairro}
                      {selectedBairros.includes(bairro) && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                  {selectedBairros.length > 0 && (
                    <button 
                      onClick={() => setSelectedBairros([])}
                      className="px-4 py-2 rounded-full text-sm font-bold border-2 border-dashed border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 flex flex-col items-center justify-center text-center">
                  <p className="text-stone-500 font-bold uppercase text-xs tracking-widest mb-1">Qtd. Entregas</p>
                  <p className="text-3xl font-black text-stone-800">{filteredDeliveries.length}</p>
                </div>
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 flex flex-col items-center justify-center text-center">
                  <p className="text-blue-600/70 font-bold uppercase text-xs tracking-widest mb-1">Soma das Taxas</p>
                  <p className="text-3xl font-black text-blue-700">
                    {formatCurrency(filteredDeliveries.reduce((acc, o) => acc + (Number(o.taxaEntrega) || 0), 0))}
                  </p>
                </div>
                <div className="bg-green-50 p-5 rounded-2xl border border-green-200 flex flex-col items-center justify-center text-center">
                  <p className="text-green-600/70 font-bold uppercase text-xs tracking-widest mb-1">Total Faturado</p>
                  <p className="text-3xl font-black text-green-700">
                    {formatCurrency(filteredDeliveries.reduce((acc, o) => acc + (Number(o.total) || 0), 0))}
                  </p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden shadow-sm">
                {renderDeliveryClosureTable(filteredDeliveries)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: HISTÓRICO DE FECHAMENTOS COM FILTROS AVANÇADOS */}
        <TabsContent value="historico" className="mt-6 focus-visible:outline-none">
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-6">
              {cashRegisters.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-stone-300 text-stone-400">
                  <p className="font-bold text-lg">Histórico Vazio</p>
                  <p>Nenhum caixa foi fechado até o momento.</p>
                </div>
              ) : (
                cashRegisters.map((reg) => {
                  const regOrders = orders.filter(
                    (o) =>
                      o.isPaid &&
                      o.status !== "cancelado" &&
                      new Date(o.createdAt).getTime() >= new Date(reg.openedAt).getTime() &&
                      new Date(o.createdAt).getTime() <= new Date(reg.closedAt).getTime(),
                  );

                  return (
                    <Card key={reg.id} className="overflow-hidden border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col lg:flex-row cursor-pointer hover:bg-stone-50 transition-colors" onClick={() => handleExpandReg(reg.id)}>
                        <div className="bg-stone-100 p-4 lg:w-64 border-b lg:border-b-0 lg:border-r border-stone-200 flex flex-col justify-center">
                          <div className="mb-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Abertura</p>
                            <p className="font-bold text-stone-700">{ajustarFusoHorario(reg.openedAt)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Fechamento</p>
                            <p className="font-bold text-stone-700">{ajustarFusoHorario(reg.closedAt)}</p>
                          </div>
                        </div>
                        <div className="p-4 flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 items-center relative">
                          <div>
                            <p className="text-xs font-bold text-stone-500 mb-1 flex items-center gap-1"><Wallet className="w-3 h-3" /> Vendas Brutas</p>
                            <p className="text-xl font-black text-stone-800">{formatCurrency(reg.totalSales)}</p>
                            <p className="text-xs font-medium text-stone-400">{reg.orderCount} pedidos</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1"><HeartHandshake className="w-3 h-3" /> Gorjetas</p>
                            <p className="text-xl font-black text-blue-700">+{formatCurrency(reg.totalTips)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Despesas</p>
                            <p className="text-xl font-black text-red-700">-{formatCurrency(reg.totalExpenses)}</p>
                          </div>
                          <div className="bg-stone-800 p-3 rounded-xl text-center shadow-inner text-white col-span-2 md:col-span-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-0.5">Líquido Retido</p>
                            <p className="text-2xl font-black">{formatCurrency(reg.netTotal)}</p>
                          </div>
                          <div className="absolute right-4 text-stone-400 flex items-center justify-center h-full">
                            {expandedReg === reg.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                          </div>
                        </div>
                      </div>
                      
                      {/* ÁREA EXPANDIDA DO RELATÓRIO COM FILTROS */}
                      {expandedReg === reg.id && (
                        <div className="border-t border-stone-200 bg-stone-100/50 p-4 sm:p-6 animate-in slide-in-from-top-2 space-y-6">
                          
                          {/* BARRA DE FILTROS */}
                          <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-4">
                            <span className="text-sm font-bold text-stone-500 mr-2 flex items-center gap-1.5"><LayoutList className="w-4 h-4"/> Exibir:</span>
                            <Button 
                              size="sm" 
                              variant={historyFilter === "TUDO" ? "default" : "outline"} 
                              onClick={() => setHistoryFilter("TUDO")} 
                              className={historyFilter === "TUDO" ? "bg-stone-800" : "bg-white"}
                            >
                              Visão Geral (Tudo)
                            </Button>
                            <Button 
                              size="sm" 
                              variant={historyFilter === "LOCAL" ? "default" : "outline"} 
                              onClick={() => setHistoryFilter("LOCAL")} 
                              className={historyFilter === "LOCAL" ? "bg-blue-600 hover:bg-blue-700" : "bg-white"}
                            >
                              <Utensils className="w-4 h-4 mr-2" /> Apenas Mesas
                            </Button>
                            <Button 
                              size="sm" 
                              variant={historyFilter === "ENTREGA" ? "default" : "outline"} 
                              onClick={() => setHistoryFilter("ENTREGA")} 
                              className={historyFilter === "ENTREGA" ? "bg-purple-600 hover:bg-purple-700" : "bg-white"}
                            >
                              <Motorbike className="w-4 h-4 mr-2" /> Apenas Delivery
                            </Button>
                          </div>

                          {/* LÓGICA DINÂMICA DE EXIBIÇÃO BASEADA NO FILTRO */}
                          {(() => {
                            const filteredOrders = regOrders.filter(o => historyFilter === "TUDO" || getOrderType(o.address) === historyFilter);
                            const sumBruto = filteredOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
                            const sumTaxas = filteredOrders.reduce((acc, o) => acc + (Number(o.taxaEntrega) || 0), 0);
                            const sumLiquido = sumBruto - sumTaxas;
                            const qtdPedidos = filteredOrders.length;
                            
                            return (
                              <div className="space-y-4 animate-in fade-in duration-300">
                                
                                {/* CARDS DINÂMICOS */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  
                                  {historyFilter === "ENTREGA" && (
                                    <>
                                      <div className="bg-white p-5 rounded-xl border border-blue-200 flex flex-col justify-center shadow-sm">
                                        <p className="text-blue-500 font-bold uppercase text-[10px] tracking-widest mb-1">Valor das Entregas (Taxas)</p>
                                        <p className="text-3xl font-black text-blue-700">{formatCurrency(sumTaxas)}</p>
                                      </div>
                                      <div className="bg-white p-5 rounded-xl border border-stone-200 flex flex-col justify-center shadow-sm">
                                        <p className="text-stone-500 font-bold uppercase text-[10px] tracking-widest mb-1">Total Venda (S/ Entregas)</p>
                                        <p className="text-3xl font-black text-stone-700">{formatCurrency(sumLiquido)}</p>
                                      </div>
                                      <div className="bg-white p-5 rounded-xl border border-green-200 flex flex-col justify-center shadow-sm">
                                        <p className="text-green-600 font-bold uppercase text-[10px] tracking-widest mb-1">Faturamento Bruto (Delivery)</p>
                                        <p className="text-3xl font-black text-green-700">{formatCurrency(sumBruto)}</p>
                                      </div>
                                    </>
                                  )}

                                  {historyFilter === "LOCAL" && (
                                    <>
                                      <div className="bg-white p-5 rounded-xl border border-blue-200 flex flex-col justify-center shadow-sm">
                                        <p className="text-blue-500 font-bold uppercase text-[10px] tracking-widest mb-1">Faturamento Bruto (Mesas)</p>
                                        <p className="text-3xl font-black text-blue-700">{formatCurrency(sumBruto)}</p>
                                      </div>
                                      <div className="bg-white p-5 rounded-xl border border-stone-200 flex flex-col justify-center shadow-sm">
                                        <p className="text-stone-500 font-bold uppercase text-[10px] tracking-widest mb-1">Qtd. Pedidos Salão</p>
                                        <p className="text-3xl font-black text-stone-700">{qtdPedidos}</p>
                                      </div>
                                      <div className="bg-white p-5 rounded-xl border border-green-200 flex flex-col justify-center shadow-sm">
                                        <p className="text-green-600 font-bold uppercase text-[10px] tracking-widest mb-1">Ticket Médio (Mesas)</p>
                                        <p className="text-3xl font-black text-green-700">{formatCurrency(sumBruto / (qtdPedidos || 1))}</p>
                                      </div>
                                    </>
                                  )}

                                  {historyFilter === "TUDO" && (
                                    <>
                                      <div className="bg-white p-5 rounded-xl border border-stone-200 flex flex-col justify-center shadow-sm">
                                        <p className="text-stone-500 font-bold uppercase text-[10px] tracking-widest mb-1">Faturamento Total (Geral)</p>
                                        <p className="text-3xl font-black text-stone-700">{formatCurrency(sumBruto)}</p>
                                      </div>
                                      <div className="bg-white p-5 rounded-xl border border-blue-200 flex flex-col justify-center shadow-sm">
                                        <p className="text-blue-500 font-bold uppercase text-[10px] tracking-widest mb-1">Faturamento Salão</p>
                                        <p className="text-3xl font-black text-blue-700">
                                          {formatCurrency(regOrders.filter(o => getOrderType(o.address) === "LOCAL").reduce((acc, o) => acc + (Number(o.total) || 0), 0))}
                                        </p>
                                      </div>
                                      <div className="bg-white p-5 rounded-xl border border-purple-200 flex flex-col justify-center shadow-sm">
                                        <p className="text-purple-600 font-bold uppercase text-[10px] tracking-widest mb-1">Faturamento Delivery</p>
                                        <p className="text-3xl font-black text-purple-700">
                                          {formatCurrency(regOrders.filter(o => getOrderType(o.address) === "ENTREGA").reduce((acc, o) => acc + (Number(o.total) || 0), 0))}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                                
                                {/* TABELA DINÂMICA */}
                                <div className="rounded-lg border shadow-sm overflow-hidden bg-white">
                                  {historyFilter === "ENTREGA" 
                                    ? renderDeliveryClosureTable(filteredOrders) 
                                    : renderOrdersTable(filteredOrders)
                                  }
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}