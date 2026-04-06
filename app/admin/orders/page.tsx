// app/admin/orders/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, ChefHat, CreditCard, Banknote, QrCode, 
  Ban, Bike, CheckCheck, MapPin, Phone, AlertCircle, CalendarDays, ShoppingBag, Info
} from "lucide-react";
import type { Order } from "@/lib/types";

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateString?: string) {
  if (!dateString) return "--/--/---- --:--";
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ElementType }> = {
  novo: { label: "Novo / Pendente", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Clock },
  aprovado: { label: "Em Preparação", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: ChefHat },
  pronto: { label: "Saiu para Entrega / Rota", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Bike },
  entregue: { label: "Concluído", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: CheckCheck },
  cancelado: { label: "Cancelado", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: Ban },
};

const paymentIcons: Record<string, React.ElementType> = {
  cartao: CreditCard,
  dinheiro: Banknote,
  pix: QrCode,
};

function OrderHistoryCard({ order }: { order: Order }) {
  const { sizes, menuItems, products } = useStore();
  
  const { label, bg, text, border, icon: StatusIcon } = statusConfig[order.status] || statusConfig.novo;
  const PaymentIcon = paymentIcons[order.paymentMethod] || Banknote;

  const getSizeName = (sizeId: string) => sizes.find((s) => s.id === sizeId)?.name || "Tamanho Indefinido";
  const getItemName = (itemId: string) => menuItems.find((i) => i.id === itemId)?.name || itemId;
  const getProductName = (prodId: string) => products.find((p) => p.id === prodId)?.name || prodId;

  return (
    <Card className={`border-2 ${border} shadow-sm overflow-hidden flex flex-col h-full bg-white dark:bg-stone-900`}>
      {/* CABEÇALHO DO CARD */}
      <CardHeader className={`${bg} border-b ${border} pb-4`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-black px-2 py-0.5 rounded-md bg-white/60 ${text} uppercase tracking-wider`}>
                #{order.id.slice(0, 6)}
              </span>
              <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> {formatDate(order.createdAt)}
              </span>
            </div>
            <CardTitle className={`text-lg font-black ${order.status === "cancelado" ? "line-through text-stone-400" : "text-stone-800 dark:text-stone-100"}`}>
              {order.customerName}
            </CardTitle>
          </div>
          <Badge variant="outline" className={`${bg} ${text} ${border} font-bold flex items-center gap-1.5 py-1 px-2.5`}>
            <StatusIcon className="w-3.5 h-3.5" /> {label}
          </Badge>
        </div>
      </CardHeader>

      {/* CORPO DO CARD (INFORMAÇÕES) */}
      <CardContent className="p-4 flex-1 flex flex-col space-y-5">
        
        {/* Contato e Endereço */}
        <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-stone-400" />
            <span className="font-medium text-stone-700 dark:text-stone-300">{order.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 shrink-0 text-stone-400" />
            <span>{order.phone || "Não informado"}</span>
          </div>
        </div>

        {/* Itens do Pedido */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-bold text-stone-800 dark:text-stone-200 border-b pb-1">
            <ShoppingBag className="w-4 h-4 text-orange-600" /> Resumo do Pedido
          </div>
          
          {order.items?.map((item: any, idx: number) => (
            <div key={`mac-${idx}`} className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-lg border border-stone-100 dark:border-stone-700 text-xs space-y-1.5">
              <div className="font-black text-sm text-stone-800 dark:text-stone-200 mb-1.5">
                Macarrão {getSizeName(item.sizeId)}
              </div>
              {item.pastaId && (
                <div className="grid grid-cols-[80px_1fr]"><span className="text-stone-500 font-medium">Massa:</span> <span className="font-semibold">{getItemName(item.pastaId)}</span></div>
              )}
              {item.sauces?.length > 0 && (
                <div className="grid grid-cols-[80px_1fr]"><span className="text-stone-500 font-medium">Molhos:</span> <span className="font-semibold">{item.sauces.map(getItemName).join(", ")}</span></div>
              )}
              {item.temperos?.length > 0 && (
                <div className="grid grid-cols-[80px_1fr]"><span className="text-stone-500 font-medium">Temperos:</span> <span className="font-semibold">{item.temperos.map(getItemName).join(", ")}</span></div>
              )}
              {item.ingredients?.length > 0 && (
                <div className="grid grid-cols-[80px_1fr]"><span className="text-stone-500 font-medium">Ingred.:</span> <span className="font-semibold">{item.ingredients.map(getItemName).join(", ")}</span></div>
              )}
              {item.extraCheese && (
                <div className="text-amber-600 font-black mt-1 inline-block bg-amber-100 px-2 py-0.5 rounded">+ Queijo Extra</div>
              )}
            </div>
          ))}

          {order.products && order.products.length > 0 && (
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900 text-xs">
              <div className="font-bold text-blue-800 dark:text-blue-400 mb-2">Produtos Avulsos:</div>
              <ul className="space-y-1">
                {order.products.map((prod: any, idx: number) => (
                  <li key={`prod-${idx}`} className="flex justify-between text-stone-700 dark:text-stone-300 font-medium">
                    <span>{prod.quantity}x {getProductName(prod.productId)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Observação */}
        {order.observation && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs border border-amber-200 dark:border-amber-900">
            <div className="font-black text-amber-800 dark:text-amber-500 mb-1 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Observação
            </div>
            <p className="text-amber-900 dark:text-amber-400 font-medium italic">"{order.observation}"</p>
          </div>
        )}

        {/* RODAPÉ DO CARD (Pagamento, Horários e Total) */}
        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 mt-auto space-y-3">
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 font-medium text-stone-600">
              <PaymentIcon className="w-4 h-4" /> <span className="uppercase">{order.paymentMethod}</span>
            </div>
            <Badge variant="secondary" className={order.isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
              {order.isPaid ? "PAGO" : "PENDENTE"}
            </Badge>
          </div>

          <div className="flex items-end justify-between">
            <div className="text-[10px] text-stone-400 font-medium space-y-0.5">
              <p>Feito em: {formatDate(order.createdAt)}</p>
              {order.deliveredAt && order.status === "entregue" && (
                <p className="text-green-600 font-bold">Entregue: {formatDate(order.deliveredAt)}</p>
              )}
            </div>
            <div className={`text-xl font-black ${order.status === "cancelado" ? "text-stone-400 line-through" : "text-stone-800 dark:text-stone-100"}`}>
              {formatCurrency(order.total)}
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOrdersHistoryPage() {
  const { orders, sync } = useStore();
  const [activeTab, setActiveTab] = useState("todos");

  useEffect(() => {
    sync();
    // Atualiza a cada 10 segundos apenas para manter o histórico fresco
    const interval = setInterval(() => sync(), 10000); 
    return () => clearInterval(interval);
  }, [sync]);

  // Ordena sempre do mais recente para o mais antigo
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case "concluidos":
        return sortedOrders.filter(o => o.status === "entregue");
      case "andamento":
        return sortedOrders.filter(o => ["novo", "aprovado", "pronto"].includes(o.status));
      case "cancelados":
        return sortedOrders.filter(o => o.status === "cancelado");
      case "todos":
      default:
        return sortedOrders;
    }
  }, [sortedOrders, activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-3xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
             Histórico Geral
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            Consulta detalhada de todos os pedidos registrados no sistema.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-500 bg-stone-50 dark:bg-stone-800 px-4 py-2 rounded-lg border border-stone-100 dark:border-stone-700">
          <Info className="w-4 h-4 text-blue-500" /> Somente visualização. Ações foram movidas para o Painel Dashboard.
        </div>
      </div>

      {/* FILTROS E LISTAGEM */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-white dark:bg-stone-900 p-1 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-wrap h-auto gap-1">
          <TabsTrigger value="todos" className="data-[state=active]:bg-stone-800 data-[state=active]:text-white font-bold">
            Todos os Pedidos
          </TabsTrigger>
          <TabsTrigger value="andamento" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold">
            Em Andamento
          </TabsTrigger>
          <TabsTrigger value="concluidos" className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold">
            Concluídos
          </TabsTrigger>
          <TabsTrigger value="cancelados" className="data-[state=active]:bg-red-600 data-[state=active]:text-white font-bold">
            Cancelados
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderHistoryCard key={order.id} order={order} />
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl bg-white/50 dark:bg-stone-900/50">
              <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-bold">Nenhum pedido encontrado nesta categoria.</p>
            </div>
          )}
        </div>
      </Tabs>
      
    </div>
  );
}