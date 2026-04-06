// app/admin/orders/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  ChefHat,
  CreditCard,
  Banknote,
  QrCode,
  Ban,
  Bike,
  CheckCircle2,
  MapPin,
  Phone,
  AlertCircle,
  ShoppingBag,
  Info,
  DollarSign,
  MessageCircle,
  Settings2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import type { Order } from "@/lib/types";

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateString?: string) {
  if (!dateString) return "--/--/---- --:--";
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusConfig: Record<
  string,
  {
    label: string;
    headerClass: string;
    badgeClass: string;
    icon: React.ElementType;
  }
> = {
  novo: {
    label: "Aguardando",
    headerClass: "bg-gradient-to-r from-blue-500 to-blue-600",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Clock,
  },
  aprovado: {
    label: "Preparando",
    headerClass: "bg-gradient-to-r from-orange-500 to-orange-600",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
    icon: ChefHat,
  },
  pronto: {
    label: "Em Rota",
    headerClass: "bg-gradient-to-r from-amber-500 to-amber-600",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Bike,
  },
  entregue: {
    label: "Concluído",
    headerClass: "bg-gradient-to-r from-green-500 to-emerald-600",
    badgeClass: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
  },
  cancelado: {
    label: "Cancelado",
    headerClass: "bg-gradient-to-r from-red-500 to-red-600",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    icon: Ban,
  },
};

const paymentIcons: Record<string, React.ElementType> = {
  cartao: CreditCard,
  dinheiro: Banknote,
  pix: QrCode,
};

function OrderHistoryCard({ order }: { order: Order }) {
  const { sizes, menuItems, products, settings } = useStore();

  const {
    label,
    headerClass,
    badgeClass,
    icon: StatusIcon,
  } = statusConfig[order.status] || statusConfig.novo;
  const PaymentIcon = paymentIcons[order.paymentMethod] || Banknote;

  const getSizeName = (sizeId: string) =>
    sizes.find((s) => s.id === sizeId)?.name || "Tamanho Indefinido";
  const getItemName = (itemId: string) =>
    menuItems.find((i) => i.id === itemId)?.name || itemId;
  const getProductName = (prodId: string) =>
    products.find((p) => p.id === prodId)?.name || prodId;

  // Gerador do Texto Completo do Pedido para o WhatsApp
  const handleWhatsApp = () => {
    if (!order.phone) return;

    let descPedido = "";

    // Lista os macarrões
    order.items?.forEach((item: any) => {
      descPedido += `\n🍝 *Macarrão ${getSizeName(item.sizeId)}*`;
      if (item.pastaId)
        descPedido += `\n  - Massa: ${getItemName(item.pastaId)}`;
      if (item.sauces?.length)
        descPedido += `\n  - Molhos: ${item.sauces.map(getItemName).join(", ")}`;
      if (item.temperos?.length)
        descPedido += `\n  - Temperos: ${item.temperos.map(getItemName).join(", ")}`;
      if (item.ingredients?.length)
        descPedido += `\n  - Ingredientes: ${item.ingredients.map(getItemName).join(", ")}`;
      if (item.extraCheese) descPedido += `\n  - 🧀 + Queijo Extra`;
      descPedido += "\n";
    });

    // Lista os produtos avulsos
    if (order.products && order.products.length > 0) {
      descPedido += `\n🛍️ *Outros Itens*`;
      order.products.forEach((prod: any) => {
        descPedido += `\n  - ${prod.quantity}x ${getProductName(prod.productId)}`;
      });
      descPedido += "\n";
    }

    if (order.observation) descPedido += `\n⚠️ *Obs:* ${order.observation}\n`;

    // Limpa espaços extras no início e fim
    descPedido = descPedido.trim();

    // Link de Rastreio Público
    const trackingLink = `${window.location.origin}/pedido/${order.id}`;

    // Aplica o template
    let msg =
      settings.whatsappMessage ||
      "Olá {{nome}}, seu pedido:\n{{pedido}}\n\nTotal: {{total}}\nAcompanhe aqui: {{link}}";
    msg = msg
      .replace(/{{nome}}/g, order.customerName)
      .replace(/{{pedido}}/g, descPedido)
      .replace(/{{total}}/g, formatCurrency(order.total))
      .replace(/{{status}}/g, label)
      .replace(/{{link}}/g, trackingLink);

    const cleanPhone = order.phone.replace(/\D/g, "");
    window.open(
      `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  return (
    <Card className="shadow-lg rounded-2xl overflow-hidden flex flex-col bg-white dark:bg-stone-900 border-none h-[520px]">
      {/* HEADER DA FICHA */}
      <div
        className={`${headerClass} shrink-0 text-white px-4 py-2.5 flex justify-between items-center text-xs sm:text-sm font-medium`}
      >
        <span>Ficha Pedido: #{order.id.slice(0, 8)}</span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {formatDate(order.createdAt)}
        </span>
      </div>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col overflow-hidden">
        {/* DADOS DO CLIENTE & STATUS LINK */}
        <div className="shrink-0 space-y-3 mb-4">
          <div className="flex justify-between items-start gap-2">
            <h2
              className={`text-2xl font-black leading-none tracking-tight ${order.status === "cancelado" ? "line-through text-stone-400" : "text-stone-800 dark:text-stone-100"}`}
            >
              {order.customerName}
            </h2>

            {/* AGORA O STATUS É UM LINK CLICÁVEL PARA A PÁGINA DO CLIENTE */}
            <Link
              href={`/pedido/${order.id}`}
              target="_blank"
              title="Abrir página de rastreio do cliente"
            >
              <Badge
                variant="outline"
                className={`${badgeClass} font-bold flex items-center gap-1.5 py-1 px-2.5 whitespace-nowrap hover:scale-105 transition-transform cursor-pointer shadow-sm`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {label}
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </Badge>
            </Link>
          </div>

          <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400 font-medium">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-stone-400" />
              <span className="leading-snug line-clamp-2">{order.address}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-stone-400" />
                <span>{order.phone || "Não informado"}</span>
              </div>
              {order.phone && order.phone !== "Não informado" && (
                <button
                  onClick={handleWhatsApp}
                  className="bg-green-100 text-green-700 hover:bg-green-200 px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" /> Chamar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ÁREA SCROLLÁVEL */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar-thumb]:bg-stone-300 dark:[&::-webkit-scrollbar-track]:bg-stone-800 dark:[&::-webkit-scrollbar-thumb]:bg-stone-600 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="border-2 border-stone-200 dark:border-stone-700 rounded-xl p-3 bg-stone-50 dark:bg-stone-800/30">
            <div className="flex items-center gap-2 font-black text-stone-800 dark:text-stone-200 mb-3 text-sm">
              <ShoppingBag className="w-4 h-4 text-stone-600 dark:text-stone-400" />{" "}
              Resumo do Pedido
            </div>

            <div className="space-y-4">
              {order.items?.map((item: any, idx: number) => (
                <div
                  key={`mac-${idx}`}
                  className="border-b border-stone-200 dark:border-stone-700 last:border-0 pb-3 last:pb-0"
                >
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 mb-2 leading-none">
                    Macarrão {getSizeName(item.sizeId)}
                  </h3>

                  <div className="grid grid-cols-1 gap-y-2">
                    {item.pastaId && (
                      <div>
                        <div className="text-xs font-bold text-stone-800 dark:text-stone-300 flex items-center gap-1.5 mb-0.5">
                          <ChefHat className="w-3.5 h-3.5 text-stone-500" />{" "}
                          Massas:
                        </div>
                        <div className="text-xs text-stone-600 dark:text-stone-400 pl-1 border-l-2 border-stone-300 dark:border-stone-600 ml-1.5 whitespace-normal break-words">
                          {getItemName(item.pastaId)}
                        </div>
                      </div>
                    )}
                    {item.sauces?.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-stone-800 dark:text-stone-300 flex items-center gap-1.5 mb-0.5">
                          <span className="text-stone-500 text-sm leading-none">
                            🥫
                          </span>{" "}
                          Molhos:
                        </div>
                        <div className="text-xs text-stone-600 dark:text-stone-400 pl-1 border-l-2 border-stone-300 dark:border-stone-600 ml-1.5 whitespace-normal break-words">
                          {item.sauces.map(getItemName).join(", ")}
                        </div>
                      </div>
                    )}
                    {item.temperos?.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-stone-800 dark:text-stone-300 flex items-center gap-1.5 mb-0.5">
                          <span className="text-stone-500 text-sm leading-none">
                            🌿
                          </span>{" "}
                          Temperos:
                        </div>
                        <div className="text-xs text-stone-600 dark:text-stone-400 pl-1 border-l-2 border-stone-300 dark:border-stone-600 ml-1.5 whitespace-normal break-words">
                          {item.temperos.map(getItemName).join(", ")}
                        </div>
                      </div>
                    )}
                    {item.ingredients?.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-stone-800 dark:text-stone-300 flex items-center gap-1.5 mb-0.5">
                          <span className="text-stone-500 text-sm leading-none">
                            🥓
                          </span>{" "}
                          Ingredientes:
                        </div>
                        <div className="text-xs text-stone-600 dark:text-stone-400 pl-1 border-l-2 border-stone-300 dark:border-stone-600 ml-1.5 whitespace-normal break-words">
                          {item.ingredients.map(getItemName).join(", ")}
                        </div>
                      </div>
                    )}
                  </div>

                  {item.extraCheese && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300">
                      Queijo Extra:{" "}
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none">
                        Sim
                      </Badge>
                    </div>
                  )}
                </div>
              ))}

              {order.products && order.products.length > 0 && (
                <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-300 mb-1">
                    Outros Produtos:
                  </div>
                  <div className="text-xs text-stone-600 dark:text-stone-400 pl-1 border-l-2 border-stone-300 dark:border-stone-600 ml-1.5">
                    {order.products.map((prod: any, idx: number) => (
                      <div key={`prod-${idx}`} className="mb-0.5">
                        {prod.quantity}x {getProductName(prod.productId)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {order.observation && (
            <div className="text-xs shrink-0">
              <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />{" "}
                Observação:
              </div>
              <p className="font-medium text-stone-600 dark:text-stone-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 italic break-words">
                {order.observation}
              </p>
            </div>
          )}
        </div>

        {/* RODAPÉ DO CARD */}
        <div className="shrink-0 space-y-3 mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between text-sm bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2 font-bold text-stone-700 dark:text-stone-200">
              <PaymentIcon className="w-5 h-5 text-stone-500" /> Pagamento:{" "}
              <span className="uppercase">{order.paymentMethod}</span>
            </div>
            <Badge
              variant="secondary"
              className={`font-black tracking-wider ${order.isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {order.isPaid ? "PAGO" : "PENDENTE"}
            </Badge>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 font-bold text-lg">
              <DollarSign className="w-5 h-5" /> Total:
            </div>
            <div
              className={`text-2xl sm:text-3xl font-black ${order.status === "cancelado" ? "text-stone-400 line-through" : "text-stone-800 dark:text-stone-100"}`}
            >
              {formatCurrency(order.total)}
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-stone-400 font-medium pt-1">
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" /> Feito em:{" "}
              {formatDate(order.createdAt)}
            </div>
            {order.deliveredAt && order.status === "entregue" && (
              <div className="flex items-center gap-1 text-green-600 font-bold">
                <CheckCircle2 className="w-3 h-3" /> Entregue:{" "}
                {formatDate(order.deliveredAt)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOrdersHistoryPage() {
  const { orders, sync, settings, updateSettings } = useStore();
  const [activeTab, setActiveTab] = useState("todos");

  // Controle de Interface (Sanfona e Textarea local)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localWhatsappMsg, setLocalWhatsappMsg] = useState("");

  useEffect(() => {
    sync();
    const interval = setInterval(() => sync(), 10000);
    return () => clearInterval(interval);
  }, [sync]);

  useEffect(() => {
    setLocalWhatsappMsg(settings.whatsappMessage || "");
  }, [settings.whatsappMessage]);

  const handleMsgBlur = () => {
    if (localWhatsappMsg !== settings.whatsappMessage) {
      updateSettings({ whatsappMessage: localWhatsappMsg });
    }
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case "concluidos":
        return sortedOrders.filter((o) => o.status === "entregue");
      case "andamento":
        return sortedOrders.filter((o) =>
          ["novo", "aprovado", "pronto", "despachado"].includes(o.status),
        );
      case "cancelados":
        return sortedOrders.filter((o) => o.status === "cancelado");
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
            Histórico de Pedidos
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            Consulta detalhada de todos os pedidos e automações.
          </p>
        </div>
      </div>

      {/* PAINEL DE CONFIGURAÇÕES */}
      <Card className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden transition-all">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          <div>
            <CardTitle className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-orange-600" /> Configurações de
              Operação
            </CardTitle>
            <CardDescription className="mt-0.5">
              Gerencie aprovação automática e avisos do WhatsApp.
            </CardDescription>
          </div>
          <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full">
            {isSettingsOpen ? (
              <ChevronUp className="w-5 h-5 text-stone-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-stone-600" />
            )}
          </div>
        </div>

        {isSettingsOpen && (
          <CardContent className="pt-2 pb-5 border-t border-stone-100 dark:border-stone-800 flex flex-col md:flex-row gap-6 md:gap-12 animate-in slide-in-from-top-4 duration-300 bg-stone-50/50 dark:bg-stone-900/30">
            <div className="space-y-3 md:w-1/3 mt-3">
              <div>
                <Label className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  Aprovação Automática
                </Label>
                <p className="text-xs text-stone-500 mt-1 mb-3">
                  Se ativado, os pedidos entram direto para "Em Preparo"
                  (Cozinha), pulando a etapa de "Aguardando".
                </p>
              </div>
              <div className="flex items-center space-x-2 bg-white dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700 shadow-sm">
                <Switch
                  id="auto-approve"
                  checked={settings.autoApprove}
                  onCheckedChange={(val) =>
                    updateSettings({ autoApprove: val })
                  }
                  className="data-[state=checked]:bg-orange-600"
                />
                <Label
                  htmlFor="auto-approve"
                  className="font-bold cursor-pointer"
                >
                  {settings.autoApprove
                    ? "LIGADA (Rápido)"
                    : "DESLIGADA (Manual)"}
                </Label>
              </div>
            </div>

            <div className="space-y-3 flex-1 mt-3">
              <div>
                <Label className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  Template do WhatsApp
                </Label>
                <p className="text-xs text-stone-500 mt-1 mb-2">
                  Use as tags:{" "}
                  <code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded text-stone-800 dark:text-stone-300">
                    {"{{nome}}"}
                  </code>
                  ,{" "}
                  <code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded text-stone-800 dark:text-stone-300">
                    {"{{pedido}}"}
                  </code>
                  ,{" "}
                  <code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded text-stone-800 dark:text-stone-300">
                    {"{{total}}"}
                  </code>
                  ,{" "}
                  <code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded text-stone-800 dark:text-stone-300">
                    {"{{status}}"}
                  </code>
                  , e{" "}
                  <code className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 px-1 py-0.5 rounded font-bold">
                    {"{{link}}"}
                  </code>
                </p>
              </div>
              <Textarea
                className="resize-none h-24 bg-white dark:bg-stone-800 shadow-sm focus:ring-orange-500"
                value={localWhatsappMsg}
                onChange={(e) => setLocalWhatsappMsg(e.target.value)}
                onBlur={handleMsgBlur}
                placeholder="Ex: Olá {{nome}}, seu pedido:\n{{pedido}}\nNo valor de {{total}} está {{status}}!\nAcompanhe: {{link}}"
              />
              <p className="text-[10px] text-stone-400 text-right">
                O texto é salvo automaticamente ao clicar fora da caixa.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* FILTROS E LISTAGEM */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-white dark:bg-stone-900 p-1 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="todos"
            className="data-[state=active]:bg-stone-800 data-[state=active]:text-white font-bold"
          >
            Todos os Pedidos
          </TabsTrigger>
          <TabsTrigger
            value="andamento"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold"
          >
            Em Andamento
          </TabsTrigger>
          <TabsTrigger
            value="concluidos"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold"
          >
            Concluídos
          </TabsTrigger>
          <TabsTrigger
            value="cancelados"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white font-bold"
          >
            Cancelados
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 items-start">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderHistoryCard key={order.id} order={order} />
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl bg-white/50 dark:bg-stone-900/50">
              <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-bold">
                Nenhum pedido encontrado nesta categoria.
              </p>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
