// app/admin/orders/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Check, Clock, ChefHat, CreditCard, Banknote, QrCode, 
  Copy, MessageCircle, Settings2, Receipt, Ban, RotateCcw, Zap, Bike, CheckCheck
} from "lucide-react"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
  novo: { label: "Aguardando Confirmação", variant: "default", icon: Clock },
  aprovado: { label: "Em Preparação", variant: "secondary", icon: ChefHat },
  pronto: { label: "Saiu para Entrega", variant: "outline", icon: Bike }, // <-- TROQUE AQUI
  entregue: { label: "Entregue ao Cliente", variant: "outline", icon: CheckCheck },
  cancelado: { label: "Cancelado", variant: "destructive", icon: Ban },
}

const paymentIcons: Record<string, React.ElementType> = {
  cartao: CreditCard,
  dinheiro: Banknote,
  pix: QrCode,
};

function OrderCard({ order }: { order: any }) {
  const {
    updateOrderStatus,
    toggleOrderPaid,
    sizes,
    menuItems,
    products,
    settings,
  } = useStore();
  const {
    label,
    variant,
    icon: StatusIcon,
  } = statusConfig[order.status] || statusConfig.novo;
  const PaymentIcon = paymentIcons[order.paymentMethod] || Banknote;

  const getSizeName = (sizeId: string) =>
    sizes.find((s) => s.id === sizeId)?.name || "Tamanho Indefinido";
  const getItemName = (itemId: string) =>
    menuItems.find((i) => i.id === itemId)?.name || itemId;
  const getProductName = (prodId: string) =>
    products.find((p) => p.id === prodId)?.name || prodId;

  const handleCopyPhone = () => {
    if (order.phone) {
      navigator.clipboard.writeText(order.phone);
      alert("Telefone copiado para a área de transferência!");
    }
  };

  const handleWhatsApp = () => {
    if (order.phone) {
      const cleanPhone = order.phone.replace(/\D/g, "");
      const template =
        settings.whatsappMessage ||
        "Olá, {nome}, recebemos seu pedido! Acompanhe o status aqui: {link}";

      const trackingUrl = `${window.location.origin}/pedido/${order.id}`;

      const message = template
        .replace(/{nome}/g, order.customerName)
        .replace(/{link}/g, trackingUrl);

      window.open(
        `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`,
        "_blank",
      );
    }
  };

  return (
    <Card
      className={
        order.status === "pronto" ||
        order.status === "entregue" ||
        order.status === "cancelado"
          ? "opacity-60"
          : ""
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle
                className={`text-lg ${order.status === "cancelado" ? "text-muted-foreground line-through" : ""}`}
              >
                {order.customerName}
              </CardTitle>
              <span className="text-xs text-stone-400">
                #{order.id.slice(0, 8)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 mb-1">
              <span className="text-sm font-medium text-muted-foreground">
                {order.phone || "Telefone não informado"}
              </span>
              {order.phone && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopyPhone}
                    title="Copiar telefone"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                    onClick={handleWhatsApp}
                    title="Chamar no WhatsApp"
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
            <CardDescription>{order.address}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={variant}
              className="flex items-center gap-1 text-center leading-tight"
            >
              <StatusIcon className="h-3 w-3 shrink-0" />
              {label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(order.createdAt)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {order.items &&
          order.items.map((item: any, idx: number) => (
            <div
              key={`mac-${idx}`}
              className="p-3 bg-muted/50 rounded-lg text-sm space-y-2 border border-stone-100 dark:border-stone-800"
            >
              <div className="font-bold text-foreground">
                Macarrão {getSizeName(item.sizeId)}
              </div>
              <div className="grid gap-1 text-muted-foreground text-xs">
                {item.pastaId && (
                  <div>
                    <span className="font-semibold text-foreground">
                      Massa:
                    </span>{" "}
                    {getItemName(item.pastaId)}
                  </div>
                )}
                {item.sauces?.length > 0 && (
                  <div>
                    <span className="font-semibold text-foreground">
                      Molhos:
                    </span>{" "}
                    {item.sauces.map(getItemName).join(", ")}
                  </div>
                )}
                {item.temperos?.length > 0 && (
                  <div>
                    <span className="font-semibold text-foreground">
                      Temperos:
                    </span>{" "}
                    {item.temperos.map(getItemName).join(", ")}
                  </div>
                )}
                {item.ingredients?.length > 0 && (
                  <div>
                    <span className="font-semibold text-foreground">
                      Ingredientes:
                    </span>{" "}
                    {item.ingredients.map(getItemName).join(", ")}
                  </div>
                )}
                {item.extraCheese && (
                  <div className="text-amber-600 font-bold">+ Queijo Extra</div>
                )}
              </div>
            </div>
          ))}

        {order.products && order.products.length > 0 && (
          <div className="p-3 rounded-lg text-sm space-y-1.5 border border-stone-200 dark:border-stone-800">
            <div className="font-bold text-foreground mb-1">Outros Itens:</div>
            {order.products.map((prod: any, idx: number) => (
              <div
                key={`prod-${idx}`}
                className="flex justify-between items-center text-muted-foreground"
              >
                <span>
                  {prod.quantity}x {getProductName(prod.productId)}
                </span>
              </div>
            ))}
          </div>
        )}

        {order.observation && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm border border-amber-200 dark:border-amber-900">
            <div className="font-bold text-amber-800 dark:text-amber-500 mb-1">
              Observação do Cliente:
            </div>
            <p className="text-amber-700 dark:text-amber-400 italic">
              {order.observation}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <PaymentIcon className="h-4 w-4" />
                <span className="uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`paid-${order.id}`}
                  checked={order.isPaid}
                  disabled={order.status === "cancelado"}
                  onCheckedChange={() => toggleOrderPaid(order.id)}
                />
                <label
                  htmlFor={`paid-${order.id}`}
                  className={`text-sm font-medium ${order.status === "cancelado" ? "text-muted-foreground" : "cursor-pointer"}`}
                >
                  Pago
                </label>
              </div>
            </div>
            <div
              className={`text-xl font-bold ${order.status === "cancelado" ? "text-muted-foreground" : "text-orange-700 dark:text-orange-500"}`}
            >
              {formatCurrency(order.total)}
            </div>
          </div>

          {order.status !== "cancelado" ? (
            <div className="flex flex-col gap-2 mt-2">
              {order.status === "novo" && (
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => updateOrderStatus(order.id, "aprovado")}
                >
                  <Check className="h-4 w-4 mr-2" /> Aceitar (Mover p/ Em
                  Preparação)
                </Button>
              )}
          {order.status === "aprovado" && (
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => updateOrderStatus(order.id, "pronto")}>
                  <Bike className="h-4 w-4 mr-2" /> Marcar como Saiu para Entrega
                </Button>
              )}
              {order.status === "pronto" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => updateOrderStatus(order.id, "entregue")}
                >
                  <CheckCheck className="h-4 w-4 mr-2" /> Forçar Confirmação de
                  Entrega
                </Button>
              )}
              {(order.status === "novo" || order.status === "aprovado") && (
                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-900/30"
                  onClick={() => {
                    if (
                      confirm(
                        "Tem certeza que deseja cancelar este pedido? O valor não será mais contabilizado no caixa.",
                      )
                    ) {
                      updateOrderStatus(order.id, "cancelado");
                    }
                  }}
                >
                  <Ban className="h-4 w-4 mr-2" /> Cancelar Pedido
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Button
                variant="outline"
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900 dark:hover:bg-blue-900/30"
                onClick={() => {
                  if (
                    confirm(
                      "Deseja reverter este cancelamento? O pedido voltará para a fila Em Preparação.",
                    )
                  ) {
                    updateOrderStatus(order.id, "aprovado");
                  }
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Reverter Cancelamento
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOrdersPage() {
  const {
    orders,
    settings,
    updateSettings,
    toggleOrderPaid,
    updateOrderStatus,
    sync,
  } = useStore();

  const [isEditingMsg, setIsEditingMsg] = useState(false);
  const [msgTemplate, setMsgTemplate] = useState(
    settings.whatsappMessage ||
      "Olá, {nome}, recebemos seu pedido! Acompanhe o status aqui: {link}",
  );

  const autoApprove = !!settings.autoApprove;

  const carouselRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    sync();
    const interval = setInterval(() => {
      sync();
    }, 3000);
    return () => clearInterval(interval);
  }, [sync]);

  const handleToggleAutoApprove = (checked: boolean) => {
    updateSettings({ autoApprove: checked });
  };

  const newOrders = orders.filter((o) => o.status === "novo");
  const approvedOrders = orders.filter((o) => o.status === "aprovado");
  // AGORA INCLUIMOS TANTO OS 'PRONTOS' (SAIU P/ ENTREGA) QUANTO OS 'ENTREGUES' NO ACERTO DE CONTAS
  const completedOrders = orders.filter(
    (o) => o.status === "pronto" || o.status === "entregue",
  );
  const canceledOrders = orders.filter((o) => o.status === "cancelado");

  useEffect(() => {
    if (autoApprove && newOrders.length > 0) {
      newOrders.forEach((order) => {
        updateOrderStatus(order.id, "aprovado");
      });
    }
  }, [autoApprove, newOrders, updateOrderStatus]);

  const postItOrders = [...completedOrders].sort((a, b) => {
    if (a.isPaid === b.isPaid) return 0;
    return a.isPaid ? 1 : -1;
  });

  const handleSaveMsg = () => {
    updateSettings({ whatsappMessage: msgTemplate });
    setIsEditingMsg(false);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeft.current = carouselRef.current.scrollLeft;
  };
  const onMouseLeave = () => {
    isDragging.current = false;
  };
  const onMouseUp = () => {
    isDragging.current = false;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className="space-y-8">
      {/* SEÇÃO DE ACERTO DE CONTAS (CARROSSEL DE POST-ITS) */}
      {postItOrders.length > 0 && (
        <div className="w-full select-none">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
            <Receipt className="h-6 w-6 text-primary" /> Acerto de Contas
            (Entregas)
          </h2>
          <div
            ref={carouselRef}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            className="flex overflow-x-auto gap-4 pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-grab active:cursor-grabbing"
          >
            {postItOrders.map((order) => {
              const PaymentIcon = paymentIcons[order.paymentMethod] || Banknote;
              return (
                <Card
                  key={`postit-${order.id}`}
                  className={`min-w-[280px] sm:min-w-[320px] snap-start flex-shrink-0 transition-all duration-500 border-2 shadow-sm relative overflow-hidden ${
                    order.isPaid
                      ? "bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800 opacity-80 hover:opacity-100"
                      : "bg-red-50 border-red-300 dark:bg-red-950/20 dark:border-red-800"
                  }`}
                >
                  <div
                    className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black tracking-wider text-white rounded-bl-lg shadow-sm ${
                      order.isPaid
                        ? "bg-green-500 dark:bg-green-600"
                        : "bg-red-500 dark:bg-red-600"
                    }`}
                  >
                    {order.isPaid ? "PAGO" : "AGUARDANDO PAGAMENTO"}
                  </div>

                  {/* Mostra se o Motoboy já finalizou a entrega visualmente */}
                  {order.status === "entregue" && (
                    <div className="absolute top-0 left-0 px-2 py-1 text-[10px] font-black tracking-wider bg-blue-600 text-white rounded-br-lg shadow-sm flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" /> ENTREGUE
                    </div>
                  )}

                  <CardHeader className="pb-2 pt-6">
                    <div className="flex justify-between items-start">
                      <CardTitle
                        className={`text-lg ${order.isPaid ? "text-green-900 dark:text-green-300" : "text-red-900 dark:text-red-300"}`}
                      >
                        {order.customerName}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-3xl font-black text-foreground pt-1">
                      {formatCurrency(order.total)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-900/30"
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja cancelar este pedido? O valor não será mais contabilizado no caixa.",
                              )
                            ) {
                              updateOrderStatus(order.id, "cancelado");
                            }
                          }}
                          title="Cancelar Pedido"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground ml-2">
                          <PaymentIcon className="h-3 w-3 shrink-0" />
                          <span className="uppercase">
                            {order.paymentMethod}
                          </span>
                        </div>
                      </div>

                      {!order.isPaid ? (
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white shadow-md transition-all hover:scale-105"
                          onClick={() => toggleOrderPaid(order.id)}
                        >
                          <Check className="h-4 w-4 mr-2" /> Marcar como Pago
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-400 text-green-700 hover:bg-green-100 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/50"
                          onClick={() => toggleOrderPaid(order.id)}
                        >
                          <Check className="h-4 w-4 mr-2" /> Pago
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* CABEÇALHO PADRÃO DA PÁGINA COM CONTROLES */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestão de Pedidos
        </h1>
        <p className="text-muted-foreground mt-1">
          Aprove pedidos, acompanhe o status e fale com o cliente.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {isEditingMsg ? (
            <Card className="p-4 border-dashed bg-muted/30 max-w-2xl w-full">
              <Label className="mb-2 block font-semibold">
                Mensagem Padrão do WhatsApp
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Use <strong className="text-primary">{"{nome}"}</strong> e{" "}
                <strong className="text-primary">{"{link}"}</strong> no texto
                para o sistema substituir automaticamente.
              </p>
              <Textarea
                value={msgTemplate}
                onChange={(e) => setMsgTemplate(e.target.value)}
                className="mb-3 h-24"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveMsg}>
                  Salvar Mensagem
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingMsg(false)}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingMsg(true)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Configurar Mensagem do WhatsApp
            </Button>
          )}

          {!isEditingMsg && (
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 px-4 py-2 rounded-lg shadow-sm">
              <Zap
                className={`h-4 w-4 ${autoApprove ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`}
              />
              <Label
                htmlFor="auto-approve-toggle"
                className="text-sm font-semibold cursor-pointer"
              >
                Aprovação Automática
              </Label>
              <Switch
                id="auto-approve-toggle"
                checked={autoApprove}
                onCheckedChange={handleToggleAutoApprove}
              />
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="ativos" className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="ativos">Pedidos Ativos</TabsTrigger>
          <TabsTrigger value="cancelados">
            Cancelados
            {canceledOrders.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              >
                {canceledOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="ativos"
          className="space-y-8 focus-visible:outline-none"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-primary">
                  {newOrders.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Aguardando Confirmação
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-orange-500">
                  {approvedOrders.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Em Preparação
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-green-600">
                  {completedOrders.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Rota / Entregues
                </div>
              </CardContent>
            </Card>
          </div>

          {newOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Aguardando
                Confirmação
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {newOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}

          {approvedOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-orange-500" /> Em Preparação
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {approvedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}

          {completedOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Bike className="h-5 w-5 text-green-600" /> Entregas em
                Andamento / Finalizadas
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {completedOrders.slice(0, 6).map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}

          {orders.filter((o) => o.status !== "cancelado").length === 0 && (
            <Card className="p-12 text-center text-muted-foreground">
              Nenhum pedido ativo no momento.
            </Card>
          )}
        </TabsContent>

        <TabsContent
          value="cancelados"
          className="space-y-4 focus-visible:outline-none"
        >
          {canceledOrders.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-600">
                <Ban className="h-5 w-5" /> Histórico de Cancelados
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {canceledOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center text-muted-foreground">
              Nenhum pedido foi cancelado neste turno.
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
