// components/mesa/mesa-cart-sidebar.tsx
"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChefHat } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function MesaCartSidebar() {
  const { settings } = useStore();
  const total = 0; // Valor será dinâmico depois

  return (
    <Card className="shadow-xl border-stone-200">
      <CardHeader className="bg-stone-100/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingBag className="w-5 h-5 text-orange-700" />
          Sua Comanda
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 max-h-[60vh] overflow-y-auto">
        <div className="text-center py-8 text-stone-400">
          Nenhum item adicionado ainda.
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 p-4 bg-stone-50 border-t">
        <div className="flex justify-between w-full font-bold text-xl text-stone-800">
          <span>Total Parcial</span>
          <span>{formatCurrency(total)}</span>
        </div>

        <Button 
          className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold gap-2"
          onClick={() => {
            console.log("Enviando pedido para a cozinha...");
            // Lógica de dispatch do pedido entrará aqui
          }}
        >
          <ChefHat className="w-5 h-5" />
          Enviar para Cozinha
        </Button>
      </CardFooter>
    </Card>
  );
}