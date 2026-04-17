// app/admin/page.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { verifyFinanceiroPassword } from "@/lib/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  AlertCircle,
  Check,
  Truck,
  Ban,
  DollarSign,
  Eye,
  EyeOff,
  HeartHandshake,
  Printer,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/lib/types";
import {
  OrderDetailsView,
  PrintableOrderDetails,
} from "@/components/admin/order-details";
import {
  PrintSettingsModal,
  DEFAULT_PRINT_CONFIG,
  type PrintConfig,
} from "@/components/admin/print-settings-modal";

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(date?: string | Date) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("pt-BR");
}

function getOrderType(address: string) {
  if (!address) return "ENTREGA";
  const trimmed = address.trim().toLowerCase();
  const isMesa = trimmed.startsWith("mesa") || /^\d+$/.test(trimmed);
  return isMesa ? "LOCAL" : "ENTREGA";
}

export default function AdminDashboardPage() {
  const {
    orders,
    expenses,
    tips,
    sync,
    toggleOrderPaid,
    updateOrderStatus,
    addExpense,
    addTip,
    closeRegister,
    settings,
    updateSettings,
  } = useStore();

  const printAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    sync();
    const interval = setInterval(() => sync(), 5000);
    return () => clearInterval(interval);
  }, [sync]);

  useEffect(() => {
    const checkSchedule = () => {
      if (!settings.deliverySchedule) return;

      const now = new Date();
      now.setHours(now.getHours() - 3);
      const day = now.getDay().toString();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      const schedule: any = settings.deliverySchedule;
      const today = schedule[day];

      let shouldBeOpen = false;

      if (today && today.active) {
        if (timeStr >= today.start && timeStr <= today.end) {
          shouldBeOpen = true;
        }
      }

      if (settings.isOpen !== shouldBeOpen) {
        updateSettings({ isOpen: shouldBeOpen });
        toast.info(
          `Piloto Automático: A loja foi ${shouldBeOpen ? "ABERTA" : "FECHADA"} pelo horário programado.`,
        );
      }
    };

    const interval = setInterval(checkSchedule, 60000);
    const timeout = setTimeout(checkSchedule, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [settings.deliverySchedule, settings.isOpen, updateSettings]);

  const [isFinancialDataVisible, setIsFinancialDataVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [orderToPay, setOrderToPay] = useState<Order | null>(null);
  const [addTenPercent, setAddTenPercent] = useState(false);
  const [paymentMethodFinal, setPaymentMethodFinal] = useState<string>("pix");

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [tipDesc, setTipDesc] = useState("");

  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [printConfig, setPrintConfig] =
    useState<PrintConfig>(DEFAULT_PRINT_CONFIG);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_print_config");
      if (raw) {
        const parsed = JSON.parse(raw);
        setPrintConfig({ ...DEFAULT_PRINT_CONFIG, ...parsed });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("admin_print_config", JSON.stringify(printConfig));
    } catch {}
  }, [printConfig]);

  const { activeLocalOrders, activeDeliveryOrders, totalSales, totalExpenses } =
    useMemo(() => {
      const active = orders.filter(
        (o) =>
          o.status !== "cancelado" && !(o.status === "entregue" && o.isPaid),
      );

      return {
        activeLocalOrders: active.filter(
          (o) => getOrderType(o.address) === "LOCAL",
        ),
        activeDeliveryOrders: active.filter(
          (o) => getOrderType(o.address) === "ENTREGA",
        ),
        totalSales: orders
          .filter((o) => o.isPaid)
          .reduce((acc, o) => acc + o.total, 0),
        totalExpenses: expenses.reduce((acc, e) => acc + e.amount, 0),
      };
    }, [orders, expenses]);

  const handleAddExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (!amount || !expenseDesc.trim()) return;

    addExpense({ amount, description: expenseDesc.trim() });
    setExpenseAmount("");
    setExpenseDesc("");
    toast.success("Despesa lançada com sucesso!");
  };

  const handleAddTip = () => {
    const amount = parseFloat(tipAmount);
    if (!amount || !tipDesc.trim()) return;

    addTip({ amount, description: tipDesc.trim() });
    setTipAmount("");
    setTipDesc("");
    toast.success("Gorjeta lançada com sucesso!");
  };

  const handleConfirmPayment = () => {
    if (!orderToPay) return;

    if (addTenPercent) {
      addTip({
        amount: orderToPay.total * 0.1,
        description: `10% Serviço - ${orderToPay.address}`,
      });
    }

    if (!orderToPay.isPaid) {
      toggleOrderPaid(orderToPay.id);
    }

    if (orderToPay.status !== "entregue") {
      updateOrderStatus(orderToPay.id, "entregue");
    }

    setOrderToPay(null);
    toast.success("Pagamento confirmado com sucesso!");
  };

  const handleToggleVisibility = () => {
    if (isFinancialDataVisible) {
      setIsFinancialDataVisible(false);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      const isValid = await verifyFinanceiroPassword(authPassword);

      if (isValid) {
        setIsFinancialDataVisible(true);
        setShowAuthModal(false);
        setAuthPassword("");
      } else {
        toast.error("Senha incorreta.");
      }
    } catch (error) {
      toast.error("Erro ao verificar senha.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePrintOrder = () => {
    if (!orderToPay) return;
    window.print();
  };

  return (
    <div className="container max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .print-order-area,
          .print-order-area * {
            visibility: visible !important;
          }

          .print-order-area {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            background: white;
            color: black;
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.35;
          }

          .print-order-area.paper-58 {
            width: 58mm;
            max-width: 58mm;
          }

          .print-order-area.paper-80 {
            width: 80mm;
            max-width: 80mm;
          }

          .print-order-area,
          .print-order-area * {
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
            text-overflow: clip !important;
            overflow: visible !important;
            box-sizing: border-box !important;
          }

          .print-hide {
            display: none !important;
          }

          .receipt-item {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          @page {
            margin: 0;
          }
        }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hide">
        <div>
          <h1 className="text-3xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
            Centro de Comando
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            Acompanhe e gerencie a operação em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 bg-white dark:bg-stone-900 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex-1 md:flex-none justify-center">
            <Switch
              checked={settings.isOpen}
              onCheckedChange={(checked) => updateSettings({ isOpen: checked })}
              className="data-[state=checked]:bg-green-600"
            />
            <span
              className={`text-sm font-black tracking-wider ${
                settings.isOpen ? "text-green-600" : "text-red-500"
              }`}
            >
              {settings.isOpen ? "🟢 LOJA ABERTA" : "🔴 LOJA FECHADA"}
            </span>
          </div>

          <Button
            variant={isFinancialDataVisible ? "destructive" : "outline"}
            onClick={handleToggleVisibility}
            className="font-bold shadow-sm flex-1 md:flex-none"
          >
            {isFinancialDataVisible ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" /> Ocultar Valores
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" /> Revelar Valores
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 print-hide">
        <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white shadow-lg border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 font-medium mb-1">
                  Vendas Hoje (Pagas)
                </p>
                <h3 className="text-3xl font-black">
                  {isFinancialDataVisible
                    ? formatCurrency(totalSales)
                    : "R$ ****"}
                </h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-stone-900 shadow-sm border-stone-200 dark:border-stone-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-stone-500 font-medium mb-1">Mesas Abertas</p>
                <h3 className="text-3xl font-black text-stone-800 dark:text-stone-100">
                  {activeLocalOrders.length}
                </h3>
              </div>
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Utensils className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-stone-900 shadow-sm border-stone-200 dark:border-stone-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-stone-500 font-medium mb-1">
                  Saídas / Despesas
                </p>
                <h3 className="text-3xl font-black text-red-600">
                  {isFinancialDataVisible
                    ? formatCurrency(totalExpenses)
                    : "R$ ****"}
                </h3>
              </div>
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print-hide">
        <div className="col-span-1 lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200 dark:border-blue-900">
            <Utensils className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
              Mesas Ativas
            </h2>
            <Badge
              variant="secondary"
              className="ml-auto bg-blue-100 text-blue-700"
            >
              {activeLocalOrders.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {activeLocalOrders.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-xl border-stone-300 text-stone-400">
                Nenhuma mesa em atendimento.
              </div>
            ) : (
              activeLocalOrders.map((order) => (
                <Card
                  key={order.id}
                  className="border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-black text-lg text-blue-900 dark:text-blue-400">
                          {order.address}
                        </h3>
                        <p className="text-sm text-stone-500 font-medium">
                          {order.customerName}
                        </p>
                      </div>
                      <Badge
                        className={
                          order.status === "pronto" ||
                          order.status === "entregue"
                            ? "bg-green-100 text-green-700"
                            : order.status === "novo"
                              ? "bg-stone-100 text-stone-700"
                              : "bg-orange-100 text-orange-700"
                        }
                      >
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>

                    {order.observation && (
                      <div className="mb-2 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-1.5 text-amber-800 mb-0.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            Observação
                          </span>
                        </div>
                        <p className="text-xs font-bold text-amber-900 italic">
                          "{order.observation}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-end justify-between mt-4 border-b border-blue-50 pb-4 mb-4">
                      <div>
                        <p className="text-xs text-stone-400 uppercase font-bold tracking-wider mb-0.5">
                          Subtotal
                        </p>
                        <p className="font-black text-xl text-stone-800">
                          {formatCurrency(order.total)}
                        </p>
                      </div>

                      {!order.isPaid ? (
                        <Button
                          onClick={() => {
                            setOrderToPay(order);
                            setPaymentMethodFinal(order.paymentMethod);
                            setAddTenPercent(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 font-bold"
                        >
                          <Receipt className="w-4 h-4 mr-2" /> Fechar Conta
                        </Button>
                      ) : (
                        <Badge className="bg-green-600 text-white px-3 py-1 text-sm">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Pago
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {order.status === "novo" && (
                        <Button
                          onClick={() =>
                            updateOrderStatus(order.id, "aprovado")
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <Check className="w-4 h-4 mr-1" /> Aprovar
                        </Button>
                      )}
                      {order.status === "aprovado" && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, "pronto")}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          size="sm"
                        >
                          <Utensils className="w-4 h-4 mr-1" /> Pronto
                        </Button>
                      )}
                      {order.status === "pronto" && (
                        <Button
                          onClick={() =>
                            updateOrderStatus(order.id, "entregue")
                          }
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Servido
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, "cancelado")}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                      >
                        <Ban className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-purple-200 dark:border-purple-900">
            <Motorbike className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
              Entregas Ativas
            </h2>
            <Badge
              variant="secondary"
              className="ml-auto bg-purple-100 text-purple-700"
            >
              {activeDeliveryOrders.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {activeDeliveryOrders.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-xl border-stone-300 text-stone-400">
                Nenhuma entrega pendente.
              </div>
            ) : (
              activeDeliveryOrders.map((order) => (
                <Card
                  key={order.id}
                  className="border-purple-100 dark:border-purple-900 shadow-sm hover:shadow-md transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-stone-800">
                          {order.customerName}
                        </h3>
                        <p
                          className="text-xs text-stone-500 font-medium mt-0.5 max-w-[200px] truncate"
                          title={order.address}
                        >
                          {order.address}
                        </p>
                      </div>
                      <Badge
                        className={
                          order.status === "pronto"
                            ? "bg-amber-100 text-amber-700"
                            : order.status === "despachado"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "novo"
                                ? "bg-stone-100 text-stone-700"
                                : "bg-stone-100 text-stone-600"
                        }
                      >
                        {order.status === "pronto"
                          ? "AGUARDANDO MOTOBOY"
                          : order.status === "despachado"
                            ? "SAIU P/ ENTREGA"
                            : order.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="bg-stone-50 p-2 rounded-lg text-xs font-bold text-stone-600 flex items-center justify-between mb-3 border border-stone-100">
                      <span>Via:</span>
                      <span className="uppercase text-purple-700 flex items-center gap-1">
                        {order.paymentMethod === "pix" && (
                          <QrCode className="w-3 h-3" />
                        )}
                        {order.paymentMethod === "dinheiro" && (
                          <Banknote className="w-3 h-3" />
                        )}
                        {order.paymentMethod === "cartao" && (
                          <CreditCard className="w-3 h-3" />
                        )}
                        {order.paymentMethod}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="font-black text-xl text-stone-800">
                        {formatCurrency(order.total)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-purple-50">
                      <Button
                        variant={order.isPaid ? "default" : "outline"}
                        className={`${order.isPaid ? "bg-green-600 text-white" : "text-stone-500"}`}
                        onClick={() => toggleOrderPaid(order.id)}
                        size="sm"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        {order.isPaid ? "Pago" : "Marcar Pago"}
                      </Button>

                      {order.status === "novo" && (
                        <Button
                          onClick={() =>
                            updateOrderStatus(order.id, "aprovado")
                          }
                          className="bg-blue-600 text-white"
                          size="sm"
                        >
                          <Check className="w-4 h-4 mr-1" /> Aprovar
                        </Button>
                      )}
                      {order.status === "aprovado" && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, "pronto")}
                          className="bg-orange-600 text-white"
                          size="sm"
                        >
                          <Utensils className="w-4 h-4 mr-1" /> Pronto
                        </Button>
                      )}
                      {order.status === "pronto" && (
                        <Button
                          onClick={() =>
                            updateOrderStatus(order.id, "despachado")
                          }
                          className="bg-purple-600 text-white"
                          size="sm"
                        >
                          <Truck className="w-4 h-4 mr-1" /> Despachar
                        </Button>
                      )}
                      {order.status === "despachado" && (
                        <Button
                          onClick={() =>
                            updateOrderStatus(order.id, "entregue")
                          }
                          className="bg-green-600 text-white"
                          size="sm"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Entregue
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, "cancelado")}
                        className="text-red-500 hover:bg-red-50 ml-auto p-2"
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-4 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-stone-200 dark:border-stone-800">
            <Wallet className="w-5 h-5 text-stone-600" />
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
              Caixa Rápido
            </h2>
          </div>

          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3 bg-stone-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" /> Lançar
                Despesa / Saída
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Motivo (Ex: Gás)"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="R$"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-24"
                />
              </div>
              <Button
                onClick={handleAddExpense}
                disabled={!expenseAmount || !expenseDesc}
                className="w-full bg-stone-800 text-white font-bold"
              >
                Lançar Despesa
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-sm dark:border-blue-900">
            <CardHeader className="pb-3 bg-blue-50/50 dark:bg-blue-900/20">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <HeartHandshake className="w-4 h-4" /> Lançar Gorjeta Extra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Origem (Ex: Balcão)"
                  value={tipDesc}
                  onChange={(e) => setTipDesc(e.target.value)}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="R$"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="w-24"
                />
              </div>
              <Button
                onClick={handleAddTip}
                disabled={!tipAmount || !tipDesc}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Adicionar Gorjeta
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
            className="w-full border-red-200 text-red-600 hover:bg-red-50 font-bold py-6"
          >
            <Lock className="w-4 h-4 mr-2" /> Encerrar Turno (Fechar Caixa)
          </Button>
        </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 print-hide">
          <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <form onSubmit={handleAuthSubmit}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Acesso Restrito</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAuthModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  Digite a senha financeira para ver os valores.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="password"
                  placeholder="Senha"
                  autoFocus
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? "Verificando..." : "Desbloquear"}
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {orderToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in print-hide">
          <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b bg-stone-50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-blue-900">
                    Fechar Conta
                  </CardTitle>
                  <CardDescription className="font-bold text-stone-500 mt-0.5">
                    {orderToPay.address} • {orderToPay.customerName}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOrderToPay(null)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6 overflow-y-auto">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-stone-500">
                    Resumo do Pedido
                  </h3>
                </div>

                <OrderDetailsView order={orderToPay} />
              </div>

              {orderToPay.observation && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-700 mb-1">
                    Observação geral do pedido
                  </p>
                  <p className="text-sm font-semibold text-amber-900">
                    {orderToPay.observation}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center text-lg">
                <span className="font-medium text-stone-600">
                  Subtotal Consumido:
                </span>
                <span className="font-bold text-stone-800">
                  {formatCurrency(orderToPay.total)}
                </span>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <Label className="text-base font-bold text-blue-900">
                    Incluir 10% de Serviço?
                  </Label>
                  <p className="text-sm font-medium text-blue-700 mt-1">
                    Gorjeta:{" "}
                    <span className="font-black">
                      +{formatCurrency(orderToPay.total * 0.1)}
                    </span>
                  </p>
                </div>
                <Switch
                  checked={addTenPercent}
                  onCheckedChange={setAddTenPercent}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <div className="flex justify-between items-end border-t pt-4">
                <span className="text-sm font-bold uppercase text-stone-500 tracking-wider">
                  Total a Receber
                </span>
                <span className="text-3xl font-black text-green-600">
                  {formatCurrency(
                    orderToPay.total +
                      (addTenPercent ? orderToPay.total * 0.1 : 0),
                  )}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-stone-600">Forma de Pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "pix", label: "PIX", icon: QrCode },
                    { id: "dinheiro", label: "Dinheiro", icon: Banknote },
                    { id: "credito", label: "Cartão", icon: CreditCard },
                  ].map((method) => (
                    <button
                      type="button"
                      key={method.id}
                      onClick={() => setPaymentMethodFinal(method.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                        paymentMethodFinal === method.id
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-stone-200 text-stone-500 hover:border-stone-300"
                      }`}
                    >
                      <method.icon className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase">
                        {method.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPrintSettings(true)}
                  className="py-6 text-base font-bold"
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Impressão
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrintOrder}
                  className="py-6 text-base font-bold"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>

                <Button
                  onClick={handleConfirmPayment}
                  className="py-6 text-base font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg"
                >
                  Confirmar Recebimento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <PrintSettingsModal
        open={showPrintSettings}
        onClose={() => setShowPrintSettings(false)}
        value={printConfig}
        onChange={setPrintConfig}
      />

      {orderToPay && (
        <div
          ref={printAreaRef}
          className={`print-order-area ${
            printConfig.paperWidth === "58mm" ? "paper-58" : "paper-80"
          } hidden`}
        >
          {(() => {
            const serviceFee = addTenPercent ? orderToPay.total * 0.1 : 0;
            const finalTotal = orderToPay.total + serviceFee;

            return (
              <div
                style={{
                  paddingTop: `${printConfig.marginTop}mm`,
                  paddingRight: `${printConfig.marginRight}mm`,
                  paddingBottom: `${printConfig.marginBottom}mm`,
                  paddingLeft: `${printConfig.marginLeft}mm`,
                  fontSize: `${printConfig.fontSize}px`,
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "10px" }}>
                  <div style={{ fontWeight: 700, fontSize: "16px" }}>
                    FECHAMENTO DE CONTA
                  </div>
                  <div>Mesa: {orderToPay.address}</div>

                  {printConfig.showCustomer && (
                    <div>
                      Cliente: {orderToPay.customerName || "Não informado"}
                    </div>
                  )}

                  <div>
                    Data:{" "}
                    {formatDateTime(
                      (orderToPay as any).createdAt || new Date(),
                    )}
                  </div>
                </div>

                <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

                <PrintableOrderDetails order={orderToPay} config={printConfig} />

                {printConfig.showGeneralObservation && orderToPay.observation ? (
                  <>
                    <div
                      style={{ borderTop: "1px dashed #000", margin: "8px 0" }}
                    />
                    <div
                      style={{
                        fontSize: "11px",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      <strong>Obs. pedido:</strong> {orderToPay.observation}
                    </div>
                  </>
                ) : null}

                <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Subtotal</span>
                  <strong>{formatCurrency(orderToPay.total)}</strong>
                </div>

                {printConfig.showServiceFee && addTenPercent && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Serviço 10%</span>
                    <strong>{formatCurrency(serviceFee)}</strong>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "6px",
                    fontSize: "15px",
                  }}
                >
                  <span>
                    <strong>TOTAL</strong>
                  </span>
                  <strong>{formatCurrency(finalTotal)}</strong>
                </div>

                {printConfig.showPaymentMethod && (
                  <div style={{ marginTop: "10px" }}>
                    <div>Pagamento: {paymentMethodFinal.toUpperCase()}</div>
                  </div>
                )}

                <div
                  style={{ borderTop: "1px dashed #000", margin: "10px 0" }}
                />

                <div style={{ textAlign: "center", fontSize: "11px" }}>
                  Comprovante impresso pelo navegador
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}