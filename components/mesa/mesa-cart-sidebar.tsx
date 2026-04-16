// components/mesa/mesa-cart-sidebar.tsx
"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Receipt, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function MesaCartSidebar() {
  const { settings } = useStore();

  return (
    <Card className="shadow-xl border-stone-200">
      <CardHeader className="bg-stone-100/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingBag className="w-5 h-5 text-orange-700" />
          Sua Comanda
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 max-h-[60vh] overflow-y-auto">
        {/* Lista de Itens aqui - Componentizado */}
        <div className="text-center py-8 text-stone-400">
          Seu carrinho está vazio
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 p-4 bg-stone-50 border-t">
        <div className="flex justify-between w-full font-bold text-xl">
          <span>Total</span>
          <span>{formatCurrency(0)}</span>
        </div>

        <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold">
          Pedir Agora
        </Button>

        {/* Novo botão de Fechar Conta com suporte a cartão */}
        <Button variant="outline" className="w-full border-stone-300 gap-2">
          <Receipt className="w-4 h-4" />
          Pedir Conta
        </Button>
      </CardFooter>
    </Card>
  );
}