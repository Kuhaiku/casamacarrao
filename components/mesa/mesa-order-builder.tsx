// components/mesa/mesa-order-builder.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";

interface MesaOrderBuilderProps {
  sizeId: string;
  onCancel: () => void;
  onFinish: (order: any) => void;
}

export function MesaOrderBuilder({ sizeId, onCancel, onFinish }: MesaOrderBuilderProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
      <h2 className="text-2xl font-black mb-6">Montar Macarrão</h2>
      
      {/* O miolo das opções (massas, molhos) virá aqui. 
          Por enquanto, este é o esqueleto limpo para fazer compilar e fluir a tela. */}
      <div className="py-12 text-center text-stone-500">
        [Interface de montagem isolada para a Mesa]
      </div>

      <div className="flex gap-4 pt-6 border-t mt-6">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex-1 py-6 text-base font-bold border-stone-300 text-stone-600"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={() => onFinish({ sizeId, pastas: [], sauces: [], ingredients: [] })}
          className="flex-1 py-6 text-base font-bold bg-green-600 hover:bg-green-700"
        >
          <Check className="w-5 h-5 mr-2" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}