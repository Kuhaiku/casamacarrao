// components/mesa/mesa-menu-view.tsx
"use client";

import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface MesaMenuViewProps {
  onSelectPasta: (size: any) => void;
}

export function MesaMenuView({ onSelectPasta }: MesaMenuViewProps) {
  const { sizes, products, productCategories } = useStore();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-orange-700 rounded-full" />
          Monte seu Macarrão
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sizes.map((size) => (
            <Card key={size.id} 
              className="p-4 cursor-pointer hover:border-orange-500 transition-all active:scale-95 group"
              onClick={() => onSelectPasta(size)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{size.name}</h3>
                  <p className="text-stone-500 text-sm">{size.maxIngredients} ingredientes inclusos</p>
                </div>
                <div className="text-right">
                  <span className="block font-black text-orange-700 text-xl">
                    R$ {size.price.toFixed(2)}
                  </span>
                  <Plus className="inline w-5 h-5 text-stone-300 group-hover:text-orange-600" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Outras categorias de produtos aqui */}
    </div>
  );
}