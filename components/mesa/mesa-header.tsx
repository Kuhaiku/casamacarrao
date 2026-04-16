// components/mesa/mesa-header.tsx
"use client";

import { ChefHat } from "lucide-react";

export function MesaHeader() {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-700">
          <ChefHat className="w-6 h-6" />
          <span className="font-black text-xl tracking-tight">Casa do Macarrão</span>
        </div>
        <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-bold text-sm">
          Atendimento Mesa
        </div>
      </div>
    </header>
  );
}