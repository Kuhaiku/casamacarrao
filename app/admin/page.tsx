// app/admin/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Wallet, 
  Utensils, 
  Motorbike, 
  Banknote, 
  CreditCard, 
  QrCode, 
  Receipt,
  TrendingDown,
  Lock,
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import type { Order } from "@/lib/types";

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Função para identificar se o pedido é no local ou entrega
function getOrderType(address: string) {
  if (!address) return "ENTREGA";
  const trimmed = address.trim().toLowerCase();
  const isMesa = trimmed.startsWith("mesa") || /^\d+$/.test(trimmed);
  return isMesa ? "LOCAL" : "ENTREGA";
}

export default function AdminDashboardPage() {
  const { orders, expenses, tips, sync, toggleOrderPaid, updateOrderStatus, addExpense, addTip, closeRegister } = useStore();

  // Atualiza os dados a cada 5 segundos
  useEffect(() => {
    sync();
    const interval = setInterval(() => {
      sync();
    }, 5000);
    return () => clearInterval(interval);
  }, [sync]);

  // Estados do Modal de Pagamento (Mesas)
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);
  const [addTenPercent, setAddTenPercent] = useState(false);
  const [paymentMethodFinal, setPaymentMethodFinal] = useState<string>("pix");

  // Estados do Lançamento Rápido
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");

  // Processamento de Dados
  const { activeLocalOrders, activeDeliveryOrders, totalSales, totalExpenses } = useMemo(() => {
    // Pedidos que ainda não foram pagos e não estão cancelados
    const active = orders.filter(o => !o.isPaid && o.status !== "cancelado");
    
    return {
      activeLocalOrders: active.filter(o => getOrderType(o.address) === "LOCAL"),
      activeDeliveryOrders: active.filter(o => getOrderType(o.address) === "ENTREGA"),
      totalSales: orders.filter(o => o.isPaid).reduce((acc, o) => acc + o.total, 0),
      totalExpenses: expenses.reduce((acc, e) => acc + e.amount, 0),
    };
  }, [orders, expenses]);

  // Lançamento de Despesa Rápida
  const handleAddExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (!amount || !expenseDesc.trim()) return;
    addExpense({ amount, description: expenseDesc.trim() });
    setExpenseAmount("");
    setExpenseDesc("");
  };

  // Finalizar Conta da Mesa
  const handleConfirmPayment = () => {
    if (!orderToPay) return;

    // Se ligou os 10%, lança como gorjeta no sistema
    if (addTenPercent) {
      const tipValue = orderToPay.total * 0.1;
      addTip({ amount: tipValue, description: `10% Serviço - ${orderToPay.address}` });
    }

    toggleOrderPaid(orderToPay.id);
    if (orderToPay.status !== "entregue") {
      updateOrderStatus(orderToPay.id, "entregue");
    }
    
    setOrderToPay(null);
  };

  // Fechar pedido de Entrega direto
  const handleDeliveryPaid = (orderId: string, currentStatus: string) => {
    toggleOrderPaid(orderId);
    if (currentStatus !== "entregue") {
      updateOrderStatus(orderId, "entregue");
    }
  };

  return (
    <div className="container max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
      
      {/* 1. MÉTRICAS DO TOPO */}
      <div>
        <h1 className="text-3xl font-black text-stone-800 dark:text-stone-100 tracking-tight">Centro de Comando</h1>
        <p className="text-stone-500 font-medium mt-1">Acompanhe e gerencie a operação em tempo real.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white shadow-lg border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 font-medium mb-1">Vendas Hoje (Pagas)</p>
                <h3 className="text-3xl font-black">{formatCurrency(totalSales)}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl"><Wallet className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-stone-900 shadow-sm border-stone-200 dark:border-stone-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-stone-500 font-medium mb-1">Mesas Abertas</p>
                <h3 className="text-3xl font-black text-stone-800 dark:text-stone-100">{activeLocalOrders.length}</h3>
              </div>
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Utensils className="w-6 h-6" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-stone-900 shadow-sm border-stone-200 dark:border-stone-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-stone-500 font-medium mb-1">Saídas / Despesas</p>
                <h3 className="text-3xl font-black text-red-600">{formatCurrency(totalExpenses)}</h3>
              </div>
              <div className="p-3 bg-red-100 text-red-600 rounded-xl"><TrendingDown className="w-6 h-6" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. PAINEL DE OPERAÇÃO DIVIDIDO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA 1: MESAS */}
        <div className="col-span-1 lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200 dark:border-blue-900">
            <Utensils className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">Mesas Ativas</h2>
            <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">{activeLocalOrders.length}</Badge>
          </div>

          <div className="space-y-3">
            {activeLocalOrders.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-xl border-stone-300 text-stone-400">
                Nenhuma mesa em atendimento.
              </div>
            ) : (
              activeLocalOrders.map(order => (
                <Card key={order.id} className="border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-black text-lg text-blue-900 dark:text-blue-400">{order.address}</h3>
                        <p className="text-sm text-stone-500 font-medium">{order.customerName}</p>
                      </div>
                      <Badge className={order.status === "pronto" || order.status === "entregue" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* OBSERVAÇÃO - MESAS */}
                    {order.observation && (
                      <div className="mb-2 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-900">
                        <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-500 mb-0.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Observação</span>
                        </div>
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-400 italic">
                          "{order.observation}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-end justify-between mt-4">
                      <div>
                        <p className="text-xs text-stone-400 uppercase font-bold tracking-wider mb-0.5">Subtotal</p>
                        <p className="font-black text-xl text-stone-800 dark:text-stone-200">{formatCurrency(order.total)}</p>
                      </div>
                      <Button 
                        onClick={() => {
                          setOrderToPay(order);
                          setPaymentMethodFinal(order.paymentMethod);
                          setAddTenPercent(false); // Reset padrão
                        }}
                        className="bg-blue-600 hover:bg-blue-700 font-bold"
                      >
                        <Receipt className="w-4 h-4 mr-2" /> Fechar Conta
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* COLUNA 2: ENTREGAS */}
      <div className="space-y-3">
            {activeDeliveryOrders.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-xl border-stone-300 text-stone-400">
                Nenhuma entrega pendente de pagamento.
              </div>
            ) : (
              activeDeliveryOrders.map(order => (
                <Card key={order.id} className="border-purple-100 dark:border-purple-900 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-stone-800 dark:text-stone-200">{order.customerName}</h3>
                        <p className="text-xs text-stone-500 font-medium mt-0.5 max-w-[200px] truncate" title={order.address}>{order.address}</p>
                      </div>
                      <Badge className={
                        order.status === "pronto" ? "bg-amber-100 text-amber-700" :
                        order.status === "despachado" ? "bg-blue-100 text-blue-700" :
                        "bg-stone-100 text-stone-600"
                      }>
                        {order.status === "pronto" ? "AGUARDANDO RETIRADA" : 
                         order.status === "despachado" ? "SAIU P/ ENTREGA" : 
                         order.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="bg-stone-50 dark:bg-stone-800 p-2 rounded-lg text-xs font-bold text-stone-600 flex items-center justify-between mb-3 border border-stone-100">
                      <span>Pagamento via:</span>
                      <span className="uppercase text-purple-700 dark:text-purple-400 flex items-center gap-1">
                        {order.paymentMethod === "pix" && <QrCode className="w-3 h-3" />}
                        {order.paymentMethod === "cartao" && <CreditCard className="w-3 h-3" />}
                        {order.paymentMethod === "dinheiro" && <Banknote className="w-3 h-3" />}
                        {order.paymentMethod}
                      </span>
                    </div>

                    {order.observation && (
                      <div className="mb-3 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-900">
                        <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-500 mb-0.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Observação</span>
                        </div>
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-400 italic">
                          "{order.observation}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-end justify-between mt-2">
                      <p className="font-black text-xl text-stone-800 dark:text-stone-200">{formatCurrency(order.total)}</p>
                      <Button 
                        onClick={() => handleDeliveryPaid(order.id, order.status)}
                        className="bg-green-600 hover:bg-green-700 font-bold text-xs px-3"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Pago
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

        {/* COLUNA 3: CAIXA RÁPIDO */}
        <div className="col-span-1 lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-stone-200 dark:border-stone-800">
            <Wallet className="w-5 h-5 text-stone-600" />
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">Caixa Rápido</h2>
          </div>

          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3 bg-stone-50/50">
              <CardTitle className="text-lg">Adicionar Despesa / Saída</CardTitle>
              <CardDescription>Registre pagamentos, compras de insumos, vale motoboy, etc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 50.00" 
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição / Motivo</Label>
                <Input 
                  placeholder="Ex: Pagamento Motoboy" 
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleAddExpense}
                disabled={!expenseAmount || !expenseDesc}
                className="w-full bg-stone-800 hover:bg-stone-900 text-white font-bold"
              >
                Lançar Despesa
              </Button>
            </CardContent>
          </Card>

          <Button 
            onClick={() => {
              if (window.confirm("Deseja realmente fechar o caixa de hoje?")) {
                closeRegister();
              }
            }}
            variant="outline" 
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold py-6"
          >
            <Lock className="w-4 h-4 mr-2" /> Encerrar Turno (Fechar Caixa)
          </Button>
        </div>
      </div>

      {/* =========================================
          MODAL: FECHAR CONTA (MESAS)
      ========================================= */}
      {orderToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b bg-stone-50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-blue-900">Fechar Conta</CardTitle>
                  <CardDescription className="font-bold text-stone-500 mt-0.5">{orderToPay.address} • {orderToPay.customerName}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOrderToPay(null)} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {/* Resumo Base */}
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium text-stone-600">Subtotal Consumido:</span>
                <span className="font-bold text-stone-800">{formatCurrency(orderToPay.total)}</span>
              </div>

              {/* Toggle 10% */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <Label className="text-base font-bold text-blue-900 flex items-center gap-2">
                    Incluir 10% de Serviço?
                  </Label>
                  <p className="text-sm font-medium text-blue-700 mt-1">
                    Gorjeta: <span className="font-black">+{formatCurrency(orderToPay.total * 0.1)}</span>
                  </p>
                </div>
                <Switch 
                  checked={addTenPercent} 
                  onCheckedChange={setAddTenPercent}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              {/* Total Final */}
              <div className="flex justify-between items-end border-t pt-4">
                <span className="text-sm font-bold uppercase text-stone-500 tracking-wider">Total a Receber</span>
                <span className="text-3xl font-black text-green-600">
                  {formatCurrency(orderToPay.total + (addTenPercent ? orderToPay.total * 0.1 : 0))}
                </span>
              </div>

              {/* Confirmação de Pagamento */}
              <div className="space-y-3 pt-2">
                <Label className="text-stone-600">Forma de Pagamento (Confirmada)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "pix", label: "PIX", icon: QrCode },
                    { id: "cartao", label: "Cartão", icon: CreditCard },
                    { id: "dinheiro", label: "Dinheiro", icon: Banknote }
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethodFinal(method.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all ${paymentMethodFinal === method.id ? "border-green-600 bg-green-50 text-green-700" : "border-stone-200 text-stone-500 hover:border-stone-300"}`}
                    >
                      <method.icon className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleConfirmPayment}
                className="w-full py-6 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg"
              >
                Confirmar Recebimento
              </Button>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}