// app/mesa/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useStore } from "@/lib/store";
import { MesaHeader } from "@/components/mesa/mesa-header";
import { MesaMenuView } from "@/components/mesa/mesa-menu-view";
import { MesaCartSidebar } from "@/components/mesa/mesa-cart-sidebar";
import { MesaOrderBuilder } from "@/components/mesa/mesa-order-builder";Restart TS Server
import { Loader2 } from "lucide-react";

export default function MesaPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <MesaContent />
    </Suspense>
  );
}

function MesaContent() {
  const { sync } = useStore();
  const [view, setView] = useState<"menu" | "builder">("menu");
  const [activeOrder, setActiveOrder] = useState<any>(null);

  useEffect(() => {
    sync();
  }, [sync]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <MesaHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Lado Esquerdo: Menu ou Builder */}
          <div className="flex-1 w-full">
            {view === "menu" ? (
              <MesaMenuView onSelectPasta={(size) => {
                setActiveOrder({ sizeId: size.id, pastas: [], sauces: [], seasonings: [], ingredients: [] });
                setView("builder");
              }} />
            ) : (
              <MesaOrderBuilder 
                sizeId={activeOrder?.sizeId} 
                onCancel={() => setView("menu")}
                onFinish={(order) => {
                  // Lógica para adicionar ao carrinho da mesa
                  setView("menu");
                }}
              />
            )}
          </div>

          {/* Lado Direito: Carrinho Fixo (Regra solicitada) */}
          <aside className="w-full lg:w-96 sticky top-6">
            <MesaCartSidebar />
          </aside>
        </div>
      </main>
    </div>
  );
}