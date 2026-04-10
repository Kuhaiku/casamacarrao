"use client";

import { useState } from "react";
import { ChefHat, ShoppingBag } from "lucide-react";
import { useStore } from "@/lib/store";
import { OrderBuilder } from "@/components/customer/order-builder";
import { Checkout } from "@/components/customer/checkout"; // Importamos o novo componente
import { useOrder } from "@/lib/order-context";

export default function CustomerHome() {
  const { settings } = useStore();
  const { step } = useOrder(); // Usamos o step do contexto para decidir o que mostrar
  const [view, setView] = useState<"menu" | "builder">("menu");

  return (
    <main className="min-h-screen bg-stone-50 pb-20">
      {/* Header Simples */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-700" />
            <h1 className="font-bold text-xl tracking-tight">Casa do Macarrão</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto pt-6">
        {view === "menu" ? (
          <div className="px-4 space-y-8 text-center py-12">
              <h2 className="text-3xl font-extrabold">Monte seu Prato</h2>
              <p className="text-stone-600">Escolha sua massa, molho e ingredientes favoritos.</p>
              <button 
                onClick={() => setView("builder")}
                className="bg-orange-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-orange-800 transition-all"
              >
                Começar Pedido
              </button>
          </div>
        ) : (
          // Aqui está o segredo: se o step for menor que o limite, mostra o montador.
          // Se o usuário avançar além do montador, mostra o Checkout separado.
          <div className="px-4">
             {step < 1 ? ( 
               <OrderBuilder /> 
             ) : ( 
               <Checkout /> 
             )}
          </div>
        )}
      </div>
    </main>
  );
}