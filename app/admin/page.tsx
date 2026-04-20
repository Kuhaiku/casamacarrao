"use client";

import { useState } from "react";
import { useAdminDashboard } from "@/lib/hooks/use-admin-dashboard";
import { OrdersPanel } from "@/components/admin/orders-panel";
import { PaymentModal } from "@/components/admin/modals/payment-modal";
import { AuthModal } from "@/components/admin/modals/auth-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Utensils, Motorbike, Wallet, TrendingDown, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/lib/types";

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminDashboardPage() {
  const { activeLocalOrders, activeDeliveryOrders, totalSales, totalExpenses, store } = useAdminDashboard();
  
  const [isFinancialVisible, setFinancialVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);

  // Estados locais para formulários rápidos
  const [expense, setExpense] = useState({ desc: "", amount: "" });

  const handleAddExpense = () => {
    if (!expense.amount || !expense.desc) return;
    store.addExpense({ amount: parseFloat(expense.amount), description: expense.desc });
    setExpense({ desc: "", amount: "" });
    toast.success("Despesa lançada.");
  };

  return (
    <div className="container max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-800 dark:text-stone-100 tracking-tight">Centro de Comando</h1>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 bg-white dark:bg-stone-900 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex-1 md:flex-none">
            <Switch checked={store.settings.isOpen} onCheckedChange={(c) => store.updateSettings({ isOpen: c })} />
            <span className={`text-sm font-black tracking-wider ${store.settings.isOpen ? "text-green-500" : "text-red-500"}`}>
              {store.settings.isOpen ? "ABERTA" : "FECHADA"}
            </span>
          </div>
          <Button variant={isFinancialVisible ? "secondary" : "outline"} onClick={() => isFinancialVisible ? setFinancialVisible(false) : setShowAuthModal(true)}>
            {isFinancialVisible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {isFinancialVisible ? "Ocultar" : "Valores"}
          </Button>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-stone-900 text-white shadow-md border-none dark:bg-black">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-stone-400 font-medium mb-1">Vendas Hoje</p>
              <h3 className="text-3xl font-black">{isFinancialVisible ? formatCurrency(totalSales) : "R$ ****"}</h3>
            </div>
            <Wallet className="w-8 h-8 text-stone-600" />
          </CardContent>
        </Card>
        <Card className="shadow-sm border-stone-200 dark:border-stone-800 dark:bg-stone-900">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-stone-500 font-medium mb-1">Mesas Abertas</p>
              <h3 className="text-3xl font-black">{activeLocalOrders.length}</h3>
            </div>
            <Utensils className="w-8 h-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card className="shadow-sm border-stone-200 dark:border-stone-800 dark:bg-stone-900">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-stone-500 font-medium mb-1">Despesas</p>
              <h3 className="text-3xl font-black text-red-500">{isFinancialVisible ? formatCurrency(totalExpenses) : "R$ ****"}</h3>
            </div>
            <TrendingDown className="w-8 h-8 text-red-100 dark:text-red-950" />
          </CardContent>
        </Card>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA MESAS */}
        <div className="xl:col-span-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
            <Utensils className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold">Mesas Ativas</h2>
          </div>
          <OrdersPanel type="LOCAL" orders={activeLocalOrders} onPay={setOrderToPay} updateStatus={store.updateOrderStatus} togglePaid={store.toggleOrderPaid} />
        </div>

        {/* COLUNA ENTREGAS */}
        <div className="xl:col-span-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
            <Motorbike className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold">Entregas Ativas</h2>
          </div>
          <OrdersPanel type="ENTREGA" orders={activeDeliveryOrders} onPay={setOrderToPay} updateStatus={store.updateOrderStatus} togglePaid={store.toggleOrderPaid} />
        </div>

        {/* COLUNA CAIXA RÁPIDO */}
        <div className="xl:col-span-4 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
            <Wallet className="w-5 h-5 text-stone-500" />
            <h2 className="text-lg font-bold">Caixa Rápido</h2>
          </div>

          <Card className="border-stone-200 dark:border-stone-800 shadow-sm dark:bg-stone-900">
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm font-bold text-stone-600 dark:text-stone-400">Lançar Despesa</p>
              <div className="flex gap-2">
                <Input placeholder="Motivo" value={expense.desc} onChange={(e) => setExpense({ ...expense, desc: e.target.value })} />
                <Input type="number" placeholder="R$" className="w-24" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} />
              </div>
              <Button onClick={handleAddExpense} disabled={!expense.amount || !expense.desc} className="w-full">Registrar</Button>
            </CardContent>
          </Card>

          <Button onClick={() => window.confirm("Fechar caixa de hoje?") && store.closeRegister()} variant="destructive" className="w-full font-bold py-6">
            <Lock className="w-4 h-4 mr-2" /> Encerrar Turno
          </Button>
        </div>
      </div>

      {showAuthModal && <AuthModal onSuccess={() => setFinancialVisible(true)} onClose={() => setShowAuthModal(false)} />}
      {orderToPay && <PaymentModal order={orderToPay} onClose={() => setOrderToPay(null)} onConfirm={store.toggleOrderPaid} updateStatus={store.updateOrderStatus} addTip={store.addTip} />}
    </div>
  );
}