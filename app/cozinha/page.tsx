// app/cozinha/page.tsx
"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChefHat, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeSince(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}min`;
}

// Função para identificar se o pedido é no local ou entrega
function getOrderType(address: string) {
  if (!address) return "ENTREGA";
  const trimmed = address.trim().toLowerCase();
  // É local se começar com a palavra "mesa" ou se for apenas números
  const isMesa = trimmed.startsWith("mesa") || /^\d+$/.test(trimmed);
  return isMesa ? "LOCAL" : "ENTREGA";
}

function KitchenOrderCard({ order }: { order: any }) {
  const { updateOrderStatus, sizes, menuItems, products } = useStore();

  const getSizeName = (sizeId: string) =>
    sizes.find((s) => s.id === sizeId)?.name || "Tamanho Indefinido";
  const getItemName = (itemId: string) =>
    menuItems.find((i) => i.id === itemId)?.name || itemId;
  const getProductName = (prodId: string) =>
    products.find((p) => p.id === prodId)?.name || prodId;

  const orderType = getOrderType(order.address);

  const handleMarkAsReady = () => {
    if (orderType === "LOCAL") {
      updateOrderStatus(order.id, "entregue");
    } else {
      updateOrderStatus(order.id, "pronto");
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-card shadow-md flex flex-col h-full">
      <CardHeader className="pb-3 bg-primary/5 border-b border-primary/10">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-stone-800 dark:text-stone-100">
              {order.customerName}
            </CardTitle>
            
            <div className="flex items-center gap-2 mt-2 mb-3 text-stone-600 dark:text-stone-400 font-medium">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{formatTime(order.createdAt)}</span>
              <Badge variant="secondary" className="font-bold">
                {getTimeSince(order.createdAt)}
              </Badge>
            </div>

            {orderType === "LOCAL" ? (
              <span className="bg-blue-100 text-blue-800 border border-blue-300 font-black px-3 py-1.5 rounded-lg text-xs sm:text-sm uppercase flex items-center gap-2 w-fit shadow-sm">
                🍽️ Consumo no Local ({order.address})
              </span>
            ) : (
              <span className="bg-purple-100 text-purple-800 border border-purple-300 font-black px-3 py-1.5 rounded-lg text-xs sm:text-sm uppercase flex items-center gap-2 w-fit shadow-sm">
                🛵 Entrega
              </span>
            )}

          </div>
          <Badge
            variant="outline"
            className="text-lg px-3 py-1 font-black bg-white dark:bg-stone-900 border-stone-300"
          >
            #{order.id.slice(0, 4)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 flex-1 flex flex-col">
        {order.items &&
          order.items.map((item: any, idx: number) => (
            <div
              key={`mac-${idx}`}
              className="p-4 bg-stone-100 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700"
            >
              <div className="text-xl font-black mb-3 text-orange-600 dark:text-orange-500 uppercase tracking-wide">
                Macarrão {getSizeName(item.sizeId)}
              </div>

              <div className="space-y-2 text-lg text-stone-700 dark:text-stone-300">
                {item.pastaId && (
                  <div className="flex gap-2">
                    <span className="font-black min-w-[110px]">Massa:</span>
                    <span className="font-medium">
                      {getItemName(item.pastaId)}
                    </span>
                  </div>
                )}

                {item.sauces?.length > 0 && (
                  <div className="flex gap-2">
                    <span className="font-black min-w-[110px]">Molhos:</span>
                    <span className="font-medium">
                      {item.sauces.map(getItemName).join(", ")}
                    </span>
                  </div>
                )}

                {item.temperos?.length > 0 && (
                  <div className="flex gap-2">
                    <span className="font-black min-w-[110px]">Temperos:</span>
                    <span className="font-medium">
                      {item.temperos.map(getItemName).join(", ")}
                    </span>
                  </div>
                )}

                {item.ingredients?.length > 0 && (
                  <div className="flex gap-2">
                    <span className="font-black min-w-[110px]">Ingred.:</span>
                    <span className="font-medium">
                      {item.ingredients.map(getItemName).join(", ")}
                    </span>
                  </div>
                )}

                {item.extraCheese && (
                  <div className="mt-3 inline-block bg-yellow-100 border-2 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-500 px-3 py-1 rounded-lg font-black text-lg shadow-sm">
                    + QUEIJO EXTRA
                  </div>
                )}
              </div>
            </div>
          ))}

        {order.products && order.products.length > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900">
            <div className="text-sm font-black mb-2 text-blue-800 dark:text-blue-400 uppercase tracking-wider">
              Outros Itens:
            </div>
            <div className="space-y-1.5">
              {order.products.map((prod: any, idx: number) => (
                <div
                  key={`prod-${idx}`}
                  className="text-xl font-black text-blue-950 dark:text-blue-300 flex items-center gap-2"
                >
                  <span className="bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded text-blue-900 dark:text-blue-100">
                    {prod.quantity}x
                  </span>
                  {getProductName(prod.productId)}
                </div>
              ))}
            </div>
          </div>
        )}

        {order.observation && (
          <div className="p-4 bg-amber-100 dark:bg-amber-950/50 rounded-xl border-2 border-amber-400 dark:border-amber-700 shadow-sm">
            <div className="text-sm font-black mb-2 text-amber-900 dark:text-amber-500 uppercase flex items-center gap-1.5 tracking-wider">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500" />{" "}
              Observação do Cliente:
            </div>
            <p className="text-xl font-bold text-amber-950 dark:text-amber-400 italic">
              "{order.observation}"
            </p>
          </div>
        )}

        <div className="flex-1"></div>

        <Button
          size="lg"
          className="w-full text-lg py-7 font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg transition-transform active:scale-[0.98] mt-4"
          onClick={handleMarkAsReady}
        >
          <Check className="h-7 w-7 mr-2" />
          {orderType === "LOCAL" ? "Marcar como Entregue" : "Marcar como Pronto"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function KitchenPage() {
  const { orders, sync } = useStore();

  // ATUALIZAÇÃO AUTOMÁTICA DA COZINHA (a cada 3 segundos)
  useEffect(() => {
    sync();
    const interval = setInterval(() => {
      sync();
    }, 3000);
    return () => clearInterval(interval);
  }, [sync]);

  const approvedOrders = orders.filter((o) => o.status === "aprovado");

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <header className="border-b bg-white dark:bg-stone-900 sticky top-0 z-10 shadow-sm">
        <div className="container flex h-20 items-center justify-between px-4 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-xl">
              <ChefHat className="h-8 w-8 text-orange-600 dark:text-orange-500" />
            </div>
            <div>
              <h1 className="font-black text-2xl text-stone-800 dark:text-stone-100 leading-tight">
                Cozinha
              </h1>
              <p className="text-sm font-bold text-stone-500">
                Monitor de Preparo
              </p>
            </div>
            <Badge
              variant="secondary"
              className="ml-4 text-lg px-4 py-1 bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 font-black"
            >
              {approvedOrders.length}{" "}
              {approvedOrders.length === 1 ? "pedido" : "pedidos"}
            </Badge>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm font-bold text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors bg-stone-200 dark:bg-stone-800 px-4 py-2 rounded-lg"
            >
              Voltar ao Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="container py-8 px-4 max-w-[1400px] mx-auto">
        {approvedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800">
            <ChefHat className="h-28 w-28 text-stone-300 dark:text-stone-700 mb-6" />
            <h2 className="text-3xl font-black text-stone-400 dark:text-stone-600 mb-2">
              Nenhum pedido na fila
            </h2>
            <p className="text-lg text-stone-400 dark:text-stone-600 font-medium">
              Os pedidos aprovados aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
            {approvedOrders.map((order) => (
              <KitchenOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}