// app/admin/page.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { verifyFinanceiroPassword } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Wallet, Utensils, Motorbike, Banknote, CreditCard, QrCode, Receipt,
  TrendingDown, Lock, X, CheckCircle2, AlertCircle, Check, Truck, Ban,
  DollarSign, Eye, EyeOff, HeartHandshake, Bell, BellOff, MessageCircle,
  ChevronDown, ChevronUp, Maximize2, ChevronsUp, ChevronsDown, Music
} from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/lib/types";

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getOrderType(address: string) {
  if (!address) return "ENTREGA";
  const trimmed = address.trim().toLowerCase();
  const isMesa = trimmed.startsWith("mesa") || /^\d+$/.test(trimmed);
  return isMesa ? "LOCAL" : "ENTREGA";
}

function getPaymentMethodColor(method: string) {
  const m = (method || "").toLowerCase();
  if (m.includes("pix")) return { border: "border-l-teal-400", bg: "bg-teal-50/50" };
  if (m.includes("dinheiro")) return { border: "border-l-green-400", bg: "bg-green-50/50" };
  if (m.includes("cartão") || m.includes("cartao") || m.includes("credito") || m.includes("mercado")) return { border: "border-l-indigo-400", bg: "bg-indigo-50/50" };
  return { border: "border-l-stone-200", bg: "bg-white" };
}

function OrderTimer({ createdAt }: { createdAt: string }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const createdTime = new Date(createdAt).getTime();
      const diffSeconds = Math.floor((5 * 60 * 1000 - (now - createdTime)) / 1000);
      return diffSeconds > 0 ? diffSeconds : 0;
    };

    setTimeLeft(calculateTime());
    const interval = setInterval(() => setTimeLeft(calculateTime()), 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timeLeft <= 0) return <span>00:00</span>;

  return (
    <span className={`font-mono font-black ${timeLeft <= 60 ? 'animate-pulse text-red-600' : 'text-amber-700'}`}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

export default function AdminDashboardPage() {
  const {
    orders, expenses, tips, sync, toggleOrderPaid, updateOrderStatus,
    addExpense, addTip, closeRegister, settings, updateSettings, sizes, menuItems, products,
  } = useStore();

  const [isFinancialDataVisible, setIsFinancialDataVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [orderToPayId, setOrderToPayId] = useState<string | null>(null);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  
  const [addTenPercent, setAddTenPercent] = useState(false);
  const [paymentMethodFinal, setPaymentMethodFinal] = useState<string>("pix");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [tipDesc, setTipDesc] = useState("");

  // ==========================================
  // CONFIGURAÇÕES DAS MESAS (N/N)
  // ==========================================
  const [totalTables, setTotalTables] = useState(25);
  const [isEditingTables, setIsEditingTables] = useState(false);

  useEffect(() => {
    const savedTables = localStorage.getItem("totalTables");
    if (savedTables) {
      setTotalTables(Number(savedTables));
    }
  }, []);

  // ==========================================
  // LÓGICA DE ÁUDIO (MESA VS DELIVERY VS CANCELADO)
  // ==========================================
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  const notifiedDeliveries = useRef(new Set<string>());
  const notifiedLocais = useRef(new Set<string>());
  const notifiedCanceled = useRef(new Set<string>());

  useEffect(() => {
    if (!audioEnabled) return;

    let playedCancel = false;
    let playedDelivery = false;
    let playedBell = false;

    orders.forEach((order) => {
      const type = getOrderType(order.address);

      if (order.status === "cancelado" && type === "ENTREGA") {
        if (!notifiedCanceled.current.has(order.id)) {
          notifiedCanceled.current.add(order.id);
          playedCancel = true;
        }
      } 
      else if (order.status === "novo" && type === "ENTREGA") {
        if (!notifiedDeliveries.current.has(order.id)) {
          notifiedDeliveries.current.add(order.id);
          playedDelivery = true;
        }
      } 
      else if (order.status === "novo" && type === "LOCAL") {
        if (!notifiedLocais.current.has(order.id)) {
          notifiedLocais.current.add(order.id);
          playedBell = true;
        }
      }
    });

    if (playedCancel) {
      new Audio("/cancel.mp3").play().catch(() => {});
    } else if (playedDelivery) {
      new Audio("/delivery.mp3").play().catch(() => {});
    } else if (playedBell) {
      new Audio("/bell.mp3").play().catch(() => {});
    }
  }, [orders, audioEnabled]);

  useEffect(() => {
    sync();
    const interval = setInterval(() => sync(), 5000);
    return () => clearInterval(interval);
  }, [sync]);

  // ==========================================
  // CANCELAMENTO AUTOMÁTICO (CARTÃO NÃO PAGO EM 5 MIN)
  // ==========================================
  const ordersRef = useRef(orders);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    const checkExpiredCardOrders = () => {
      const now = new Date().getTime();
      
      ordersRef.current.forEach(order => {
        const type = getOrderType(order.address);
        const method = order.paymentMethod?.toLowerCase() || "";
        const isCard = method.includes("cartão") || method.includes("cartao") || method.includes("credito") || method.includes("mercado pago") || method.includes("mercadopago");
        
        if (type === "ENTREGA" && isCard && !order.isPaid && order.status !== "cancelado") {
          const createdAt = new Date(order.createdAt).getTime();
          const diffMinutes = (now - createdAt) / (1000 * 60);
          
          if (diffMinutes >= 5) {
            updateOrderStatus(order.id, "cancelado");
            toast.error(`Pedido de ${order.customerName} cancelado (5 min sem pagamento).`);
          }
        }
      });
    };

    const interval = setInterval(checkExpiredCardOrders, 15000); 
    return () => clearInterval(interval);
  }, [updateOrderStatus]);

  useEffect(() => {
    const checkSchedule = () => {
      if (!settings.deliverySchedule) return;
      const now = new Date();
      now.setHours(now.getHours() - 3);
      const day = now.getDay().toString();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const schedule: any = settings.deliverySchedule;
      const today = schedule[day];
      let shouldBeOpen = false;

      if (today && today.active && timeStr >= today.start && timeStr <= today.end) {
        shouldBeOpen = true;
      }

      if (settings.isOpen !== shouldBeOpen) {
        updateSettings({ isOpen: shouldBeOpen });
        toast.info(`Piloto Automático: Loja ${shouldBeOpen ? "ABERTA" : "FECHADA"} pelo horário.`);
      }
    };

    const interval = setInterval(checkSchedule, 60000);
    const timeout = setTimeout(checkSchedule, 3000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [settings.deliverySchedule, settings.isOpen, updateSettings]);

  // ==========================================
  // UPLOAD DA MÚSICA DE FUNDO
  // ==========================================
  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    toast.info("Fazendo upload da música...");
    try {
      const res = await fetch('/api/settings/music', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        toast.success("Música de fundo atualizada com sucesso!");
        // O "as any" aqui evita que a tipagem falhe no build
        updateSettings({ bgMusicUrl: '/bg-music.mp3?v=' + new Date().getTime() } as any); 
      } else {
        toast.error("Erro ao fazer upload da música.");
      }
    } catch (error) {
      toast.error("Erro na comunicação com o servidor.");
    }
  };

  const { activeLocalOrders, activeDeliveryOrders, totalSales, totalExpenses, totalTips } = useMemo(() => {
    const currentShiftOrders = orders.filter((o) => !o.isAccounted);
    const currentShiftExpenses = expenses.filter((e) => !e.isAccounted);
    const currentShiftTips = tips.filter((t) => !t.isAccounted);
    const active = currentShiftOrders.filter((o) => o.status !== "cancelado" && !(o.status === "entregue" && o.isPaid));

    return {
      activeLocalOrders: active.filter((o) => getOrderType(o.address) === "LOCAL"),
      activeDeliveryOrders: active.filter((o) => getOrderType(o.address) === "ENTREGA"),
      totalSales: currentShiftOrders.filter((o) => o.isPaid && o.status !== "cancelado").reduce((acc, o) => acc + o.total, 0),
      totalExpenses: currentShiftExpenses.reduce((acc, e) => acc + e.amount, 0),
      totalTips: currentShiftTips.reduce((acc, t) => acc + t.amount, 0),
    };
  }, [orders, expenses, tips]);

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAllOrders = () => {
    if (expandedOrders.length > 0) {
      setExpandedOrders([]); 
    } else {
      const allIds = [...activeLocalOrders.map(o => o.id), ...activeDeliveryOrders.map(o => o.id)];
      setExpandedOrders(allIds);
    }
  };

  const handleAddExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (!amount || !expenseDesc.trim()) return;
    addExpense({ amount, description: expenseDesc.trim() });
    setExpenseAmount(""); setExpenseDesc("");
    toast.success("Despesa lançada!");
  };

  const handleAddTip = () => {
    const amount = parseFloat(tipAmount);
    if (!amount || !tipDesc.trim()) return;
    addTip({ amount, description: tipDesc.trim() });
    setTipAmount(""); setTipDesc("");
    toast.success("Gorjeta lançada!");
  };

  const orderToPay = orders.find(o => o.id === orderToPayId);
  const viewOrder = orders.find(o => o.id === viewOrderId);

  const handleConfirmPayment = async () => {
    if (!orderToPay) return;
    
    const finalTotal = orderToPay.total + (addTenPercent ? orderToPay.total * 0.1 : 0);
    const serviceFeeAmount = addTenPercent ? orderToPay.total * 0.1 : 0;

    const payloadData = {
      ...orderToPay,
      isPaid: true,
      paymentMethod: paymentMethodFinal,
      total: finalTotal,
      serviceFee: serviceFeeAmount
    };

    if (addTenPercent) {
        addTip({ amount: serviceFeeAmount, description: `10% Serviço - ${orderToPay.address}` });
    }
    
    if (!orderToPay.isPaid) toggleOrderPaid(orderToPay.id);
    if (orderToPay.status !== "entregue") updateOrderStatus(orderToPay.id, "entregue");

    try {
      await fetch('/api/print-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadData)
      });
      toast.success("Pago, Finalizado e Enviado para Impressão!");
    } catch (error) {
      console.error("Erro na impressão:", error);
      toast.error("Pago e finalizado, mas falhou ao enviar para a impressora.");
    }

    setOrderToPayId(null);
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
    } catch {
      toast.error("Erro ao verificar senha.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getItemName = (id: string) => {
    const item = menuItems?.find((m: any) => m.id === id);
    return item ? item.name : "Item";
  };

  const handleWhatsApp = (order: any) => {
    const phone = order.phone;
    if (!phone || phone === "Não informado") {
      toast.error("Telefone não informado.");
      return;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length >= 10) {
      let baseMessage = settings.whatsappMessage || "Olá {{nome}}! Tudo bem? Somos da Casa do Macarrão.";
      
      let itensText: string[] = [];
      if (order.items) {
         order.items.forEach((item: any) => {
           const size = sizes.find((s: any) => s.id === item.sizeId);
           itensText.push(`1x Macarrão ${size?.name || ''}`);
         });
      }
      if (order.products) {
         order.products.forEach((p: any) => {
           const prodInfo = products.find(prod => prod.id === p.productId);
           itensText.push(`${p.quantity}x ${prodInfo?.name || 'Item'}`);
         });
      }
      
      let finalMessage = baseMessage
        .replace(/\{\{?nome\}\}?/gi, order.customerName || "Cliente")
        .replace(/\{\{?pedido_id\}\}?/gi, String(order.id).split('-')[0].toUpperCase())
        .replace(/\{\{?pedido\}\}?/gi, String(order.id).split('-')[0].toUpperCase())
        .replace(/\{\{?total\}\}?/gi, formatCurrency(order.total))
        .replace(/\{\{?link\}\}?/gi, `${window.location.origin}/pedido/${order.id}`)
        .replace(/\{\{?endereco\}\}?/gi, order.address || "Retirada")
        .replace(/\{\{?itens\}\}?/gi, itensText.join(", "));

      window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(finalMessage)}`, '_blank');
    } else {
      toast.error("Número inválido.");
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-stone-100 overflow-hidden font-sans">
      
      {/* CABEÇALHO GLOBAL */}
      <div className="bg-white px-4 py-3 shrink-0 border-b border-stone-200 shadow-sm z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-stone-800 tracking-tight">Centro de Comando</h1>
          <p className="text-stone-500 font-medium text-xs">Visão geral da operação</p>
        </div>
        <div className="flex items-center gap-2">
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleAllOrders} 
            className="h-8 w-8 text-stone-600 bg-stone-50 border-stone-200"
            title={expandedOrders.length > 0 ? "Recolher Todos" : "Expandir Todos"}
          >
            {expandedOrders.length > 0 ? <ChevronsUp className="w-4 h-4" /> : <ChevronsDown className="w-4 h-4" />}
          </Button>

          <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm ml-1">
            <Switch checked={settings.isOpen} onCheckedChange={(checked) => updateSettings({ isOpen: checked })} className="data-[state=checked]:bg-green-600 scale-75" />
            <span className={`text-[10px] font-black tracking-wider ${settings.isOpen ? "text-green-600" : "text-red-500"}`}>
              {settings.isOpen ? "ABERTA" : "FECHADA"}
            </span>
          </div>

          {/* BOTÃO E SWITCH DA MÚSICA DE FUNDO DO CLIENTE */}
          <div className="flex items-center gap-2 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-200 shadow-sm ml-1 hidden sm:flex">
            <Music className="w-3.5 h-3.5 text-stone-500" />
            
            <Label htmlFor="bg-music-upload" className="cursor-pointer text-[10px] font-bold text-stone-600 hover:bg-stone-200 border border-stone-200 px-2 py-1 rounded bg-white transition-colors">
              MP3
            </Label>
            <input 
              id="bg-music-upload" 
              type="file" 
              accept="audio/mp3,audio/mpeg" 
              className="hidden" 
              onChange={handleMusicUpload} 
            />
            
            <Switch 
              checked={(settings as any).bgMusicActive || false} 
              onCheckedChange={(checked) => updateSettings({ bgMusicActive: checked } as any)} 
              className="data-[state=checked]:bg-blue-600 scale-75" 
              title="Ativar/Desativar Música de Fundo no Cardápio"
            />
          </div>
          
         <Button 
            variant={audioEnabled ? "default" : "outline"} 
            size="icon" 
            onClick={() => {
              const newAudioState = !audioEnabled;
              setAudioEnabled(newAudioState);
              if (newAudioState) {
                const audio1 = new Audio("/bell.mp3");
                const audio2 = new Audio("/delivery.mp3");
                const audio3 = new Audio("/cancel.mp3");
                audio1.play().then(() => audio1.pause()).catch(() => {}); 
                audio2.play().then(() => audio2.pause()).catch(() => {}); 
                audio3.play().then(() => audio3.pause()).catch(() => {}); 
                toast.success("Áudio ativado para Mesa, Delivery e Cancelamentos!");
              }
            }} 
            className={`h-8 w-8 ${audioEnabled ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-stone-100 text-stone-400'}`}
            title={audioEnabled ? "Silenciar" : "Ativar Som"}
          >
            {audioEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
          
          <Button variant={isFinancialDataVisible ? "destructive" : "outline"} size="icon" onClick={() => isFinancialDataVisible ? setIsFinancialDataVisible(false) : setShowAuthModal(true)} className="h-8 w-8">
            {isFinancialDataVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="shrink-0 p-3 grid grid-cols-3 gap-3">
        <Card className="bg-green-600 text-white shadow-sm border-none">
          <CardContent className="p-3 flex justify-between items-center">
            <div>
              <p className="text-green-100 font-medium text-[10px] mb-0.5">Vendas Pagas</p>
              <h3 className="text-lg sm:text-xl font-black">{isFinancialDataVisible ? formatCurrency(totalSales) : "****"}</h3>
            </div>
            <Wallet className="w-5 h-5 text-green-200 opacity-50 hidden sm:block" />
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-stone-200">
          <CardContent className="p-3 flex justify-between items-center">
            <div>
              <p className="text-stone-500 font-medium text-[10px] mb-0.5">Mesas Ativas</p>
              <h3 className="text-lg sm:text-xl font-black text-stone-800">{activeLocalOrders.length}</h3>
            </div>
            <Utensils className="w-5 h-5 text-blue-200 hidden sm:block" />
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-stone-200 overflow-hidden">
          <div className="flex h-full">
            <div className="flex-1 p-3 border-r border-stone-100 flex flex-col justify-center bg-red-50/30">
              <p className="text-red-400 font-medium text-[10px] mb-0.5 flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Despesas</p>
              <h3 className="text-base sm:text-lg font-black text-red-600 leading-none">{isFinancialDataVisible ? formatCurrency(totalExpenses) : "****"}</h3>
            </div>
            <div className="flex-1 p-3 flex flex-col justify-center bg-blue-50/30">
              <p className="text-blue-400 font-medium text-[10px] mb-0.5 flex items-center gap-1"><HeartHandshake className="w-3 h-3"/> Gorjetas</p>
              <h3 className="text-base sm:text-lg font-black text-blue-600 leading-none">{isFinancialDataVisible ? formatCurrency(totalTips) : "****"}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* ÁREA DAS COLUNAS */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 px-3 pb-3 min-h-0">
        
        {/* COLUNA: MESAS */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-stone-200 min-h-0">
          <div className="p-3 bg-blue-50/50 border-b border-stone-200 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xs font-black text-blue-900 flex items-center gap-1.5"><Utensils className="w-3.5 h-3.5" /> Mesas Ativas</h2>
              <div className="flex items-center gap-2 text-[8px] uppercase font-bold text-stone-500 bg-white px-2 py-1 rounded-md border border-blue-100 shadow-sm">
                 <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-stone-300"></div>Novo</span>
                 <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>Prep</span>
                 <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>Pronto/Serv</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
               <div className="flex items-center gap-1 text-xs font-bold text-blue-900">
                  <span>{activeLocalOrders.length} /</span>
                  {isEditingTables ? (
                    <Input 
                      type="number" 
                      className="w-12 h-5 text-xs p-1 bg-stone-50 rounded-sm outline-none" 
                      value={totalTables} 
                      onChange={e => setTotalTables(Number(e.target.value))}
                      onBlur={() => { setIsEditingTables(false); localStorage.setItem('totalTables', totalTables.toString()) }}
                      onKeyDown={e => { if(e.key === 'Enter') { setIsEditingTables(false); localStorage.setItem('totalTables', totalTables.toString())} }}
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="cursor-pointer border-b border-dashed border-blue-400 hover:text-blue-600 transition-colors" 
                      onClick={() => setIsEditingTables(true)} 
                      title="Editar capacidade total de mesas"
                    >
                      {totalTables}
                    </span>
                  )}
               </div>
               <div className="relative w-5 h-5 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-5 h-5 -rotate-90">
                    <path className="text-blue-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path className="text-blue-600 transition-all duration-500" strokeDasharray={`${Math.min(100, (activeLocalOrders.length / (totalTables || 1)) * 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                  </svg>
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {activeLocalOrders.length === 0 ? (
               <div className="text-center p-4 border border-dashed rounded-lg border-stone-200 text-stone-400 text-xs">Vazio.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
                {activeLocalOrders.map((order) => (
                  <div key={order.id} className="bg-white border border-stone-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
                    <div onClick={() => toggleExpand(order.id)} className="p-2.5 cursor-pointer hover:bg-stone-50 transition-colors flex justify-between items-start gap-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-black text-xs text-blue-900 truncate">{order.address}</h3>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${order.status === 'pronto' || order.status === 'entregue' ? 'bg-green-500' : order.status === 'novo' ? 'bg-stone-300' : 'bg-orange-500'}`} />
                        </div>
                        <p className="text-[9px] text-stone-500 truncate mt-0.5">{order.customerName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-black text-xs text-stone-800">{formatCurrency(order.total)}</span>
                        {expandedOrders.includes(order.id) ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
                      </div>
                    </div>

                    {expandedOrders.includes(order.id) && (
                      <div className="p-2.5 pt-0 border-t border-stone-100 bg-stone-50/30">
                        {order.observation && <p className="text-[9px] font-bold text-amber-700 bg-amber-50 p-1.5 rounded mb-2">Obs: {order.observation}</p>}
                        <div className="space-y-1 mb-2">
                          {order.items?.map((item: any) => {
                            const size = sizes.find((s: any) => s.id === item.sizeId);
                            return <div key={item.id} className="text-[9px] font-bold text-stone-600 bg-white p-1.5 border border-stone-100 rounded">1x Mac. {size?.name}</div>
                          })}
                          {order.products?.map((p: any, idx: number) => {
                            const prodInfo = products.find(prod => prod.id === p.productId);
                            return <div key={idx} className="text-[9px] font-bold text-stone-600 bg-white p-1.5 border border-stone-100 rounded">{p.quantity}x {prodInfo?.name || "Prod."}</div>
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* BARRA DE AÇÕES RÁPIDAS (MESA) */}
                    <div className="flex justify-between items-center p-1.5 border-t border-stone-100 bg-stone-50 shrink-0">
                      <div className="flex gap-1.5">
                        <Button
                          variant={order.isPaid ? "default" : "outline"}
                          size="icon"
                          className={`h-7 w-7 ${order.isPaid ? 'bg-green-600 text-white' : 'text-stone-600 bg-stone-200 border-stone-300'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!order.isPaid) {
                              setOrderToPayId(order.id);
                              setPaymentMethodFinal(order.paymentMethod);
                              setAddTenPercent(false);
                            }
                          }}
                          title={order.isPaid ? "Conta Paga" : "Fechar Conta"}
                        >
                          {order.isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Receipt className="w-3.5 h-3.5" />}
                        </Button>

                      {order.status !== 'despachado' && order.status !== 'entregue' && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (order.status === 'novo') updateOrderStatus(order.id, 'aprovado');
                          else if (order.status === 'aprovado') updateOrderStatus(order.id, 'pronto');
                          else if (order.status === 'pronto') updateOrderStatus(order.id, 'despachado');
                        }}
                        title="Avançar Status"
                      >
                        {order.status === 'novo' && <Check className="w-3.5 h-3.5" />}
                        {order.status === 'aprovado' && <Utensils className="w-3.5 h-3.5" />}
                        {order.status === 'pronto' && <Truck className="w-3.5 h-3.5" />}
                      </Button>
                    )}

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            if(window.confirm('Cancelar este pedido?')) updateOrderStatus(order.id, 'cancelado');
                          }}
                          title="Cancelar Pedido"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-stone-400 hover:text-stone-700"
                        onClick={(e) => { e.stopPropagation(); setViewOrderId(order.id); }}
                        title="Ver Detalhes Expandidos"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA: ENTREGAS */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-stone-200 min-h-0">
          <div className="p-3 bg-purple-50/50 border-b border-stone-200 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black text-purple-900 flex items-center gap-1.5"><Motorbike className="w-3.5 h-3.5" /> Entregas</h2>
                <Badge className="bg-purple-600 text-[10px]">{activeDeliveryOrders.length}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-[8px] uppercase font-bold text-stone-500 bg-white px-2 py-1 rounded-md border border-purple-100 shadow-sm">
                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-stone-300"></div>Novo</span>
                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-stone-500"></div>Prep</span>
                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>Pronto</span>
                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>Saiu</span>
                </div>
                <div className="flex items-center gap-2 text-[8px] uppercase font-bold text-stone-500 bg-white px-2 py-1 rounded-md border border-purple-100 shadow-sm">
                   <span className="flex items-center gap-1"><div className="w-1.5 h-3 rounded-sm bg-teal-400"></div>Pix</span>
                   <span className="flex items-center gap-1"><div className="w-1.5 h-3 rounded-sm bg-green-400"></div>Dinh</span>
                   <span className="flex items-center gap-1"><div className="w-1.5 h-3 rounded-sm bg-indigo-400"></div>Cartão</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {activeDeliveryOrders.length === 0 ? (
               <div className="text-center p-4 border border-dashed rounded-lg border-stone-200 text-stone-400 text-xs">Vazio.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
               {activeDeliveryOrders.map((order) => {
                  const pmColor = getPaymentMethodColor(order.paymentMethod);
                  const isCardPending = !order.isPaid && ["cartão", "cartao", "credito", "mercado pago", "mercadopago"].some(m => (order.paymentMethod || "").toLowerCase().includes(m));
                  
                  return (
                  <div key={order.id} className={`bg-white border border-stone-200 border-l-4 ${pmColor.border} rounded-lg shadow-sm flex flex-col overflow-hidden`}>
                    <div onClick={() => toggleExpand(order.id)} className={`p-2.5 cursor-pointer hover:bg-stone-50 transition-colors flex justify-between items-start gap-1 ${pmColor.bg}`}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-black text-xs text-stone-800 truncate">{order.customerName}</h3>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${order.status === 'pronto' ? 'bg-amber-500' : order.status === 'despachado' ? 'bg-blue-500' : order.status === 'novo' ? 'bg-stone-300' : 'bg-stone-500'}`} />
                          
                          {isCardPending && (
                             <div className="flex items-center gap-0.5 ml-1 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200 text-[9px] shadow-sm">
                                ⏳ <OrderTimer createdAt={order.createdAt} />
                             </div>
                          )}
                        </div>
                        <p className="text-[9px] text-stone-500 truncate mt-0.5" title={order.address}>{order.address}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-black text-xs text-stone-800">{formatCurrency(order.total)}</span>
                        {expandedOrders.includes(order.id) ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
                      </div>
                    </div>

                    {expandedOrders.includes(order.id) && (
                      <div className="p-2.5 pt-0 border-t border-stone-100 bg-stone-50/30">
                        {order.observation && <p className="text-[9px] font-bold text-amber-700 bg-amber-50 p-1.5 rounded mb-2">Obs: {order.observation}</p>}
                        <div className="space-y-1 mb-2">
                          {order.items?.map((item: any) => {
                            const size = sizes.find((s: any) => s.id === item.sizeId);
                            return <div key={item.id} className="text-[9px] font-bold text-stone-600 bg-white p-1.5 border border-stone-100 rounded">1x Mac. {size?.name}</div>
                          })}
                          {order.products?.map((p: any, idx: number) => {
                            const prodInfo = products.find(prod => prod.id === p.productId);
                            return <div key={idx} className="text-[9px] font-bold text-stone-600 bg-white p-1.5 border border-stone-100 rounded">{p.quantity}x {prodInfo?.name || "Prod."}</div>
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center p-1.5 border-t border-stone-100 bg-stone-50 shrink-0">
                      <div className="flex gap-1.5">
                        {!(["cartão", "cartao", "credito", "mercado pago", "mercadopago"].some(m => order.paymentMethod?.toLowerCase().includes(m))) || order.isPaid ? (
                          <Button
                            variant={order.isPaid ? "default" : "outline"}
                            size="icon"
                            className={`h-7 w-7 ${order.isPaid ? 'bg-green-600 text-white' : 'text-stone-400 bg-white'}`}
                            onClick={(e) => { e.stopPropagation(); toggleOrderPaid(order.id); }}
                            title={order.isPaid ? "Pago" : "Marcar como Pago"}
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </Button>
                        ) : null}

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (order.status === 'novo') updateOrderStatus(order.id, 'aprovado');
                            else if (order.status === 'aprovado') updateOrderStatus(order.id, 'pronto');
                            else if (order.status === 'pronto') updateOrderStatus(order.id, 'despachado');
                            {/*else if (order.status === 'despachado') updateOrderStatus(order.id, 'entregue')*/};
                          }}
                          title="Avançar Status"
                        >
                          {order.status === 'novo' && <Check className="w-3.5 h-3.5" />}
                          {order.status === 'aprovado' && <Utensils className="w-3.5 h-3.5" />}
                          {order.status === 'pronto' && <Truck className="w-3.5 h-3.5" />}
                          {order.status === 'despachado' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {/*{order.status === 'entregue' && <CheckCircle2 className="w-3.5 h-3.5" />}*/}
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/20"
                          onClick={(e) => { e.stopPropagation(); handleWhatsApp(order); }}
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-stone-400 hover:text-stone-700"
                        onClick={(e) => { e.stopPropagation(); setViewOrderId(order.id); }}
                        title="Ver Detalhes Expandidos"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA: CAIXA RÁPIDO */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-stone-200 lg:max-w-[280px] min-h-0">
          <div className="p-3 bg-stone-50 border-b border-stone-200 shrink-0 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-stone-600" />
            <h2 className="text-xs font-black text-stone-800">Caixa Rápido</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-red-600 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Nova Saída</h3>
              <Input placeholder="Motivo" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="h-8 text-xs" />
              <Input type="number" placeholder="R$" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="h-8 text-xs" />
              <Button onClick={handleAddExpense} disabled={!expenseAmount || !expenseDesc} className="w-full h-8 text-[11px] bg-stone-800 text-white font-bold">Lançar</Button>
            </div>
            <div className="space-y-2 border-t pt-3">
              <h3 className="text-[11px] font-bold text-blue-600 flex items-center gap-1"><HeartHandshake className="w-3 h-3" /> Gorjeta</h3>
              <Input placeholder="Origem" value={tipDesc} onChange={(e) => setTipDesc(e.target.value)} className="h-8 text-xs" />
              <Input type="number" placeholder="R$" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} className="h-8 text-xs" />
              <Button onClick={handleAddTip} disabled={!tipAmount || !tipDesc} className="w-full h-8 text-[11px] bg-blue-600 text-white font-bold">Lançar</Button>
            </div>
            <div className="border-t pt-3">
              <Button onClick={() => { if (window.confirm("Fechar o caixa de hoje?")) closeRegister(); }} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 text-[11px] h-9 font-bold">
                <Lock className="w-3 h-3 mr-1.5" /> Encerrar Turno
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* AUTENTICAÇÃO */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <form onSubmit={handleAuthSubmit}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Senha Financeira</CardTitle>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowAuthModal(false)} className="h-6 w-6"><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input type="password" autoFocus value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="h-9" />
                <Button type="submit" className="w-full h-9" disabled={isAuthenticating}>Desbloquear</Button>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: GERENCIAMENTO DO PEDIDO (COMPACTO) */}
      {viewOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            
            <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-4">
                <h2 className="text-base font-black text-stone-800 truncate">{viewOrder.customerName}</h2>
                <p className="text-[11px] font-bold text-stone-500 truncate">{viewOrder.address}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewOrderId(null)} className="h-7 w-7 rounded-full bg-stone-200 shrink-0 hover:bg-stone-300 transition-colors"><X className="w-4 h-4" /></Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-between items-center bg-white border border-stone-200 p-2 rounded-lg">
                <Badge className={`uppercase text-[9px] px-2 py-0.5 ${viewOrder.status === 'pronto' ? 'bg-amber-100 text-amber-700' : viewOrder.status === 'despachado' ? 'bg-blue-100 text-blue-700' : viewOrder.status === 'novo' ? 'bg-stone-200 text-stone-700' : 'bg-green-100 text-green-700'}`}>
                  Status: {viewOrder.status}
                </Badge>
                {viewOrder.isPaid ? (
                  <Badge className="bg-green-600 text-[9px] px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1" /> PAGO</Badge>
                ) : (
                  <Badge variant="outline" className="text-red-500 border-red-200 text-[9px] px-2 py-0.5">PENDENTE</Badge>
                )}
              </div>

              {viewOrder.observation && (
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <p className="text-[9px] font-black uppercase text-amber-800 mb-0.5">Observação</p>
                  <p className="text-xs font-bold text-amber-950">"{viewOrder.observation}"</p>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-stone-400">Resumo do Pedido</h3>
                {viewOrder.items?.map((item: any) => {
                  const size = sizes.find((s: any) => s.id === item.sizeId);
                  return (
                    <div key={item.id} className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                      <span className="font-black text-stone-800 text-xs block mb-1.5">Macarrão {size?.name}</span>
                      <div className="text-[11px] text-stone-600 space-y-0.5 pl-2 border-l-2 border-orange-300">
                        {item.pastaId && <div><b>Massa:</b> {getItemName(item.pastaId)}</div>}
                        {item.sauces?.length > 0 && <div><b>Molhos:</b> {item.sauces.map(getItemName).join(', ')}</div>}
                        {item.temperos?.length > 0 && <div><b>Temp:</b> {item.temperos.map(getItemName).join(', ')}</div>}
                        {item.ingredients?.length > 0 && <div><b>Ingr:</b> {item.ingredients.map(getItemName).join(', ')}</div>}
                        {item.extras?.length > 0 && <div className="text-amber-700"><b>Extra:</b> {item.extras.map(getItemName).join(', ')}</div>}
                      </div>
                    </div>
                  );
                })}
                {viewOrder.products && viewOrder.products.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-[10px] font-black uppercase text-stone-400 mb-1">Avulsos / Bebidas</h4>
                    {viewOrder.products.map((p: any, idx: number) => {
                       const prodInfo = products.find(prod => prod.id === p.productId);
                       return <div key={idx} className="text-[11px] font-bold text-stone-700 bg-stone-50 p-2 rounded border border-stone-100 mb-1">{p.quantity}x {prodInfo?.name || "Prod."}</div>
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-sm bg-stone-100 p-3 rounded-lg border border-stone-200">
                <span className="font-bold text-stone-600">Total:</span>
                <span className="font-black text-stone-900 text-base">{formatCurrency(viewOrder.total)}</span>
              </div>
            </div>

            <div className="p-3 border-t border-stone-200 bg-stone-50 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                
                {getOrderType(viewOrder.address) === "LOCAL" ? (
                  <>
                    {!viewOrder.isPaid && (
                      <Button onClick={() => { setOrderToPayId(viewOrder.id); setPaymentMethodFinal(viewOrder.paymentMethod); setAddTenPercent(false); setViewOrderId(null); }} className="bg-stone-800 hover:bg-stone-900 text-white h-9 text-[11px] font-bold col-span-2 sm:col-span-4">
                        <Receipt className="w-3.5 h-3.5 mr-1.5" /> Fechar Conta
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {!viewOrder.isPaid && !["cartão", "cartao", "credito", "mercado pago", "mercadopago"].some(m => viewOrder.paymentMethod?.toLowerCase().includes(m)) && (
                      <Button variant="outline" onClick={() => toggleOrderPaid(viewOrder.id)} className="h-9 text-[11px] font-bold border-green-200 text-green-700 hover:bg-green-50 col-span-2">
                        <DollarSign className="w-3.5 h-3.5 mr-1" /> Marcar Pago
                      </Button>
                    )}
                    <Button onClick={() => handleWhatsApp(viewOrder)} className="bg-[#25D366] hover:bg-[#1DA851] text-white h-9 text-[11px] font-bold col-span-2">
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
                    </Button>
                  </>
                )}

                {viewOrder.status === "novo" && <Button onClick={() => updateOrderStatus(viewOrder.id, "aprovado")} className="bg-blue-600 text-white h-9 text-[11px] font-bold col-span-2"><Check className="w-3.5 h-3.5 mr-1" /> Aprovar</Button>}
                {viewOrder.status === "aprovado" && <Button onClick={() => updateOrderStatus(viewOrder.id, "pronto")} className="bg-orange-500 text-white h-9 text-[11px] font-bold col-span-2"><Utensils className="w-3.5 h-3.5 mr-1" /> Pronto</Button>}
                {viewOrder.status === "pronto" && <Button onClick={() => updateOrderStatus(viewOrder.id, getOrderType(viewOrder.address) === "LOCAL" ? "entregue" : "despachado")} className="bg-purple-600 text-white h-9 text-[11px] font-bold col-span-2"><Truck className="w-3.5 h-3.5 mr-1" /> {getOrderType(viewOrder.address) === "LOCAL" ? "Servir" : "Despachar"}</Button>}

                {/* SE FOR MESA (LOCAL), PERMITE MARCAR COMO ENTREGUE/SERVIDO APÓS PRONTO. SE FOR DELIVERY, SOME O BOTÃO. */}
                {viewOrder.status === "despachado" && getOrderType(viewOrder.address) === "LOCAL" && <Button onClick={() => updateOrderStatus(viewOrder.id, "entregue")} className="bg-green-600 text-white h-9 text-[11px] font-bold col-span-2"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Entregue</Button>}
                
                <Button variant="outline" onClick={() => { updateOrderStatus(viewOrder.id, "cancelado"); setViewOrderId(null); }} className="text-red-500 border-red-200 hover:bg-red-50 h-9 text-[11px] font-bold col-span-2 sm:col-span-4 mt-1">
                  <Ban className="w-3.5 h-3.5 mr-1.5" /> Cancelar Pedido
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FECHAR CONTA */}
      {orderToPay && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between shrink-0 bg-stone-50">
              <div className="min-w-0 pr-4">
                <h2 className="text-base font-black text-blue-900 truncate">Fechar Conta</h2>
                <p className="font-bold text-stone-500 text-[10px] truncate">{orderToPay.address} • {orderToPay.customerName}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOrderToPayId(null)} className="h-7 w-7 rounded-full bg-stone-200 shrink-0 hover:bg-stone-300"><X className="w-4 h-4 text-stone-600" /></Button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-stone-400 border-b border-stone-100 pb-1">Detalhes do Consumo</h3>
                {orderToPay.items?.map((item: any) => {
                  const size = sizes.find((s: any) => s.id === item.sizeId);
                  return (
                    <div key={item.id} className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      <span className="font-black text-stone-800 text-[11px] block mb-1">Macarrão {size?.name}</span>
                      <div className="text-[10px] text-stone-600 space-y-0.5 pl-2 border-l-2 border-orange-300">
                        {item.pastaId && <div><b>Massa:</b> {getItemName(item.pastaId)}</div>}
                        {item.sauces?.length > 0 && <div><b>Molhos:</b> {item.sauces.map(getItemName).join(', ')}</div>}
                        {item.temperos?.length > 0 && <div><b>Temp:</b> {item.temperos.map(getItemName).join(', ')}</div>}
                        {item.ingredients?.length > 0 && <div><b>Ingr:</b> {item.ingredients.map(getItemName).join(', ')}</div>}
                        {item.extras?.length > 0 && <div className="text-amber-700"><b>Extra:</b> {item.extras.map(getItemName).join(', ')}</div>}
                      </div>
                    </div>
                  );
                })}
                {orderToPay.products && orderToPay.products.length > 0 && (
                  <div className="mt-2">
                    {orderToPay.products.map((p: any, idx: number) => {
                       const prodInfo = products.find(prod => prod.id === p.productId);
                       return <div key={idx} className="text-[10px] font-bold text-stone-700 bg-stone-50 p-1.5 rounded border border-stone-100 mb-1">{p.quantity}x {prodInfo?.name || "Prod."}</div>
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-sm bg-stone-100 p-3 rounded-lg border border-stone-200">
                <span className="font-medium text-stone-600">Subtotal:</span>
                <span className="font-black text-stone-800 text-base">{formatCurrency(orderToPay.total)}</span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <Label className="text-[11px] font-black text-blue-900 cursor-pointer" onClick={() => setAddTenPercent(!addTenPercent)}>Incluir 10% Serviço?</Label>
                  <p className="text-[10px] font-bold text-blue-700 mt-0.5">Gorjeta: +{formatCurrency(orderToPay.total * 0.1)}</p>
                </div>
                <Switch checked={addTenPercent} onCheckedChange={setAddTenPercent} className="data-[state=checked]:bg-blue-600 scale-75" />
              </div>

              <div className="flex justify-between items-end border-t border-stone-200 pt-3">
                <span className="text-[10px] font-black uppercase text-stone-400">Total a Receber</span>
                <span className="text-3xl font-black text-green-600 leading-none">{formatCurrency(orderToPay.total + (addTenPercent ? orderToPay.total * 0.1 : 0))}</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100">
                <Label className="text-stone-500 font-bold uppercase text-[10px]">Forma de Pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: "pix", label: "PIX", icon: QrCode }, { id: "dinheiro", label: "Dinheiro", icon: Banknote }, { id: "credito", label: "Cartão", icon: CreditCard }].map((method) => (
                    <button key={method.id} onClick={() => setPaymentMethodFinal(method.id)} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all ${paymentMethodFinal === method.id ? "border-green-600 bg-green-50 text-green-700" : "border-stone-200 text-stone-500 hover:bg-stone-50"}`}>
                      <method.icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-stone-200 bg-stone-50 shrink-0">
              <Button onClick={handleConfirmPayment} className="w-full h-10 text-xs font-black bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Fechar Conta e Imprimir
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
