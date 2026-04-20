import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Check, Utensils, Ban, Receipt, Truck, AlertCircle, DollarSign, QrCode, Banknote, CreditCard } from "lucide-react";
import type { Order } from "@/lib/types";

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface OrdersPanelProps {
  type: "LOCAL" | "ENTREGA";
  orders: Order[];
  onPay: (order: Order) => void;
  updateStatus: (id: string, status: string) => void;
  togglePaid: (id: string) => void;
}

export function OrdersPanel({ type, orders, onPay, updateStatus, togglePaid }: OrdersPanelProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-xl border-stone-200 dark:border-stone-800 text-stone-500">
        Nenhum pedido ativo.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Card key={order.id} className="border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100">
                  {type === "LOCAL" ? order.address : order.customerName}
                </h3>
                <p className="text-sm text-stone-500 font-medium truncate max-w-[200px]">
                  {type === "LOCAL" ? order.customerName : order.address}
                </p>
              </div>
              <Badge variant="secondary" className="uppercase tracking-wider text-xs">
                {order.status}
              </Badge>
            </div>

            {order.observation && (
              <div className="mb-3 bg-stone-100 dark:bg-stone-800/50 p-2 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  {order.observation}
                </p>
              </div>
            )}

            <div className="flex items-end justify-between mt-4 pb-4 border-b border-stone-100 dark:border-stone-800 mb-4">
              <div>
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Subtotal</p>
                <p className="font-black text-xl text-stone-800 dark:text-white">
                  {formatCurrency(order.total)}
                </p>
              </div>

              {type === "LOCAL" && !order.isPaid ? (
                <Button onClick={() => onPay(order)} className="font-bold">
                  <Receipt className="w-4 h-4 mr-2" /> Fechar
                </Button>
              ) : order.isPaid ? (
                <Badge className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle2 className="w-3 h-3 mr-1"/> Pago</Badge>
              ) : (
                <Button variant="outline" size="sm" onClick={() => togglePaid(order.id)}>
                  <DollarSign className="w-4 h-4 mr-1" /> Marcar Pago
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {order.status === "novo" && <Button size="sm" onClick={() => updateStatus(order.id, "aprovado")}><Check className="w-4 h-4 mr-1" /> Aprovar</Button>}
              {order.status === "aprovado" && <Button size="sm" variant="secondary" onClick={() => updateStatus(order.id, "pronto")}><Utensils className="w-4 h-4 mr-1" /> Pronto</Button>}
              {order.status === "pronto" && type === "ENTREGA" && <Button size="sm" onClick={() => updateStatus(order.id, "despachado")}><Truck className="w-4 h-4 mr-1" /> Despachar</Button>}
              {(order.status === "pronto" && type === "LOCAL") || order.status === "despachado" ? (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(order.id, "entregue")}><CheckCircle2 className="w-4 h-4 mr-1" /> Concluir</Button>
              ) : null}
              
              <Button variant="ghost" size="sm" onClick={() => updateStatus(order.id, "cancelado")} className="text-red-500 hover:bg-red-500/10 ml-auto">
                <Ban className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}