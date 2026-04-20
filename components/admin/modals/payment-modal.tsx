import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, QrCode, Banknote, CreditCard, Printer } from "lucide-react";
import type { Order } from "@/lib/types";
import { toast } from "sonner";
import { OrderDetailsView } from "@/components/admin/order-details";

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface PaymentModalProps {
  order: Order;
  onClose: () => void;
  onConfirm: (id: string) => void;
  updateStatus: (id: string, status: string) => void;
  addTip: (tip: { amount: number; description: string }) => void;
}

export function PaymentModal({ order, onClose, onConfirm, updateStatus, addTip }: PaymentModalProps) {
  const [addTenPercent, setAddTenPercent] = useState(false);
  type PaymentMethodType = "pix" | "dinheiro" | "cartao" | "pendente";
const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
  (order.paymentMethod as PaymentMethodType) || "pix"
);

  const handleConfirm = () => {
    if (addTenPercent) {
      addTip({ amount: order.total * 0.1, description: `10% Serviço - ${order.address}` });
    }
    if (!order.isPaid) {
      onConfirm(order.id);
    }
    if (order.status !== "entregue") {
      updateStatus(order.id, "entregue");
    }
    toast.success("Pagamento confirmado!");
    onClose();
  };

  const finalTotal = order.total + (addTenPercent ? order.total * 0.1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in print:hidden">
      <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b bg-stone-50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-blue-900">Fechar Conta</CardTitle>
              <CardDescription className="font-bold text-stone-500 mt-0.5">
                {order.address} • {order.customerName}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6 overflow-y-auto">
          <OrderDetailsView order={order} />

          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-stone-600">Subtotal:</span>
            <span className="font-bold text-stone-800">{formatCurrency(order.total)}</span>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <Label className="text-base font-bold text-blue-900">Incluir 10% de Serviço?</Label>
              <p className="text-sm font-medium text-blue-700 mt-1">
                Gorjeta: <span className="font-black">+{formatCurrency(order.total * 0.1)}</span>
              </p>
            </div>
            <Switch checked={addTenPercent} onCheckedChange={setAddTenPercent} className="data-[state=checked]:bg-blue-600" />
          </div>

          <div className="flex justify-between items-end border-t pt-4">
            <span className="text-sm font-bold uppercase text-stone-500 tracking-wider">Total a Receber</span>
            <span className="text-3xl font-black text-green-600">{formatCurrency(finalTotal)}</span>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-stone-600">Forma de Pagamento</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "pix", label: "PIX", icon: QrCode },
                { id: "dinheiro", label: "Dinheiro", icon: Banknote },
                { id: "cartao", label: "Cartão", icon: CreditCard },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as PaymentMethodType)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                    paymentMethod === method.id ? "border-green-600 bg-green-50 text-green-700" : "border-stone-200 text-stone-500"
                  }`}
                >
                  <method.icon className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button variant="outline" onClick={() => window.print()} className="py-6 text-base font-bold">
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
            <Button onClick={handleConfirm} className="py-6 text-base font-bold bg-green-600 hover:bg-green-700 text-white">
              Confirmar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}