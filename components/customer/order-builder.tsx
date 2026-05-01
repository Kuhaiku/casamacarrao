"use client";

import { useState } from "react";
import { Check, AlertCircle, Star, ShoppingBag } from "lucide-react";

interface OrderBuilderProps {
  db: {
    sizes: any[];
    menuItems: any[];
    settings: any;
  };
  onFinish: (order: any) => void;
  formatCurrency: (value: number) => string;
}

export function OrderBuilder({ db, onFinish, formatCurrency }: OrderBuilderProps) {
  const [step, setStep] = useState(0);
  const STEPS = ["Tamanho", "Massa", "Molhos", "Temperos", "Ingredientes"];

  const [order, setOrder] = useState({
    sizeId: null as string | null,
    pastaId: null as string | null,
    sauces: [] as string[],
    temperos: [] as string[],
    ingredients: [] as string[],
    extras: [] as string[],
  });

  const setOrd = (patch: any) => setOrder((p) => ({ ...p, ...patch }));

  const canAdvance = () => {
    if (step === 0) return !!order.sizeId;
    if (step === 1) return !!order.pastaId;
    if (step === 2) return order.sauces.length > 0;
    return true;
  };

  const selectedSize = db.sizes.find((s: any) => s.id === order.sizeId);
  let currentTotal = selectedSize?.price || 0;
  
  if (selectedSize) {
    if (!selectedSize.strictMaxSauces) {
      currentTotal += Math.max(0, order.sauces.length - selectedSize.maxSauces) * (db.settings.extraSaucePrice || 0);
    }
    if (!selectedSize.strictMaxIngredients) {
      currentTotal += Math.max(0, order.ingredients.length - selectedSize.maxIngredients) * (db.settings.extraIngredientPrice || 0);
    }
    
    order.extras.forEach((extId: string) => {
      const extraItem = db.menuItems.find((m:any) => m.id === extId);
      if(extraItem && extraItem.price) currentTotal += extraItem.price;
    });
  }

  // --- Lógica de Validação de Nhoque ---
  const isNhoqueSize = selectedSize?.name.toLowerCase().includes('nhoque');

  const massas = db.menuItems
    .filter((i: any) => i.isActive && i.category === "pasta")
    .map((massa: any) => {
      const isNhoquePasta = massa.name.toLowerCase().startsWith('nhoque');
      const isValid = isNhoqueSize ? isNhoquePasta : !isNhoquePasta;
      
      return {
        ...massa,
        isDisabled: !isValid,
        disabledReason: !isValid 
          ? (isNhoqueSize ? 'Selecione uma opção de Nhoque' : 'Exclusivo para tamanho Nhoque') 
          : null
      };
    });

  const molhos = db.menuItems.filter((i: any) => i.isActive && i.category === "sauce");
  const temperos = db.menuItems.filter((i: any) => i.isActive && i.category === "seasoning");
  const ingredientes = db.menuItems.filter((i: any) => i.isActive && i.category === "ingredient");
  const extras = db.menuItems.filter((i: any) => i.isActive && i.category === "extra");

  return (
    <div className="max-w-xl mx-auto w-full flex flex-col">
      {selectedSize && (
        <div className="sticky top-0 z-20 mb-4 bg-stone-900 rounded-xl px-4 py-3 flex items-center justify-between shadow-lg shrink-0">
          <div>
            <p className="text-stone-400 text-[10px] sm:text-xs">
              Macarrão {selectedSize.name}
            </p>
            <p className="text-white text-lg sm:text-xl font-bold">
              {formatCurrency(currentTotal)}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap w-full shrink-0">
        {STEPS.map((name, i) => (
          <div key={i} className="flex items-center shrink-0">
            <div
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${
                i < step ? "bg-green-600 text-white" : i === step ? "bg-orange-700 text-white" : "bg-stone-200 text-stone-500"
              }`}
            >
              {i < step && <Check className="w-3 h-3 inline mr-1" />}
              {name}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-3 sm:w-4 h-0.5 mx-1 ${i < step ? "bg-green-500" : "bg-stone-300"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-sm mb-6 flex-1">
        {step === 0 && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg sm:text-xl font-bold text-stone-800 mb-1">Escolha o Tamanho</h2>
            <p className="text-xs sm:text-sm text-stone-500 mb-4">Cada tamanho tem seus próprios limites.</p>
            <div className="space-y-3">
              {db.sizes.map((sz: any) => (
                <button
                  key={sz.id}
                  onClick={() => {
                    if (order.sizeId !== sz.id) {
                      // Reseta a massa ao trocar de tamanho para evitar massa inválida selecionada
                      setOrd({ sizeId: sz.id, pastaId: null });
                    }
                  }}
                  className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    order.sizeId === sz.id ? "border-orange-600 bg-orange-50" : "border-stone-200 hover:border-orange-300 bg-white"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <p className="font-bold text-stone-800 text-base sm:text-lg">{sz.name}</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-3 mt-1.5 text-[10px] sm:text-xs text-stone-500 font-medium">
                        <span className="bg-white/50 px-1.5 rounded">🍝 {sz.maxPastas} massa</span>
                        <span className="bg-white/50 px-1.5 rounded">🥫 {sz.maxSauces} molho{sz.maxSauces > 1 ? "s" : ""}</span>
                        <span className="bg-white/50 px-1.5 rounded">🥓 {sz.maxIngredients} ingr.</span>
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-orange-700">{formatCurrency(sz.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg sm:text-xl font-bold text-stone-800 mb-4">Escolha a Massa</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {massas.map((m: any) => (
                <button
                  key={m.id}
                  disabled={m.isDisabled}
                  onClick={() => setOrd({ pastaId: m.id })}
                  className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center min-h-[90px] relative ${
                    m.isDisabled 
                      ? "opacity-40 cursor-not-allowed bg-stone-50 border-stone-200" 
                      : order.pastaId === m.id 
                        ? "border-orange-600 bg-orange-50" 
                        : "border-stone-200 hover:border-orange-300 bg-white"
                  }`}
                >
                  <span className={`text-xl sm:text-2xl block mb-1 sm:mb-2 ${m.isDisabled ? 'grayscale opacity-50' : ''}`}>🍝</span>
                  <span className={`text-[11px] sm:text-sm font-bold leading-tight ${m.isDisabled ? "text-stone-400" : order.pastaId === m.id ? "text-orange-900" : "text-stone-700"}`}>
                    {m.name}
                  </span>
                  
                  {/* Feedback Visual de Indisponibilidade */}
                  {m.isDisabled && (
                    <span className="absolute -top-2 text-[8px] sm:text-[9px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full border border-stone-300 whitespace-nowrap shadow-sm">
                      {m.disabledReason}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg sm:text-xl font-bold text-stone-800">Molhos</h2>
              <span className="text-[10px] sm:text-xs font-bold bg-stone-100 px-2 py-1 rounded-full text-stone-600">
                {order.sauces.length}/{selectedSize?.maxSauces}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mb-3 sm:mb-4">Adicionais custam {formatCurrency(db.settings.extraSaucePrice || 0)}.</p>
            
            {order.sauces.length > (selectedSize?.maxSauces || 1) && !selectedSize?.strictMaxSauces && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 sm:p-3 rounded-xl flex items-center gap-2 mb-4 text-[11px] sm:text-sm font-medium">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" /> 
                Molhos extras (+{formatCurrency((order.sauces.length - selectedSize!.maxSauces) * (db.settings.extraSaucePrice || 0))})
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {molhos.map((m: any) => {
                const isActive = order.sauces.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (isActive) setOrd({ sauces: order.sauces.filter((id) => id !== m.id) });
                      else if (!selectedSize?.strictMaxSauces || order.sauces.length < selectedSize.maxSauces) setOrd({ sauces: [...order.sauces, m.id] });
                    }}
                    className={`p-3 sm:p-4 rounded-xl border-2 text-center relative transition-all flex flex-col items-center justify-center min-h-[90px] ${
                      isActive ? "border-red-600 bg-red-50" : "border-stone-200 hover:border-red-300 bg-white"
                    }`}
                  >
                    <span className="text-xl sm:text-2xl block mb-1 sm:mb-2">🥫</span>
                    <span className={`text-[11px] sm:text-sm font-bold leading-tight ${isActive ? "text-red-900" : "text-stone-700"}`}>
                      {m.name}
                    </span>
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg sm:text-xl font-bold text-stone-800 mb-1">Temperos (Grátis)</h2>
            <p className="text-xs sm:text-sm text-stone-500 mb-3 sm:mb-4">Escolha quantos quiser!</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {temperos.map((t: any) => {
                const isActive = order.temperos.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (isActive) setOrd({ temperos: order.temperos.filter((id) => id !== t.id) });
                      else setOrd({ temperos: [...order.temperos, t.id] });
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 text-center relative transition-all flex flex-col items-center justify-center min-h-[70px] ${
                      isActive ? "border-green-600 bg-green-50" : "border-stone-200 hover:border-green-300 bg-white"
                    }`}
                  >
                    <span className="text-lg sm:text-xl block mb-1">🌿</span>
                    <span className={`text-[10px] sm:text-xs font-bold leading-tight ${isActive ? "text-green-900" : "text-stone-700"}`}>
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg sm:text-xl font-bold text-stone-800">Ingredientes</h2>
              <span className="text-[10px] sm:text-xs font-bold bg-stone-100 px-2 py-1 rounded-full text-stone-600">
                {order.ingredients.length}/{selectedSize?.maxIngredients}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mb-3 sm:mb-4">Adicionais custam {formatCurrency(db.settings.extraIngredientPrice || 0)}.</p>
            
            {order.ingredients.length > (selectedSize?.maxIngredients || 4) && !selectedSize?.strictMaxIngredients && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 sm:p-3 rounded-xl flex items-center gap-2 mb-4 text-[11px] sm:text-sm font-medium">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" /> 
                Ingredientes extras (+{formatCurrency((order.ingredients.length - selectedSize!.maxIngredients) * (db.settings.extraIngredientPrice || 0))})
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-6">
              {ingredientes.map((i: any) => {
                const isActive = order.ingredients.includes(i.id);
                return (
                  <button
                    key={i.id}
                    onClick={() => {
                      if (isActive) setOrd({ ingredients: order.ingredients.filter((id) => id !== i.id) });
                      else if (!selectedSize?.strictMaxIngredients || order.ingredients.length < selectedSize.maxIngredients) setOrd({ ingredients: [...order.ingredients, i.id] });
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 text-center relative transition-all min-h-[50px] flex items-center justify-center ${
                      isActive ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-amber-300 bg-white"
                    }`}
                  >
                    <span className={`text-[10px] sm:text-xs font-bold leading-tight ${isActive ? "text-amber-900" : "text-stone-700"}`}>
                      {i.name}
                    </span>
                    {isActive && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {extras.length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-200">
                <h3 className="text-sm font-bold text-stone-800 mb-1">Adicionais Extras</h3>
                <p className="text-[11px] sm:text-xs text-stone-500 mb-3">Turbine seu pedido! (Valores cobrados à parte)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {extras.map((e: any) => {
                    const isActive = order.extras.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        onClick={() => {
                          if (isActive) setOrd({ extras: order.extras.filter((id: string) => id !== e.id) });
                          else setOrd({ extras: [...order.extras, e.id] });
                        }}
                        className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all ${
                          isActive ? "border-amber-400 bg-amber-50" : "border-stone-200 hover:border-amber-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? "text-amber-500" : "text-stone-300"}`} />
                          <div className="text-left">
                            <p className={`font-bold text-xs sm:text-sm ${isActive ? "text-amber-900" : "text-stone-800"}`}>
                              {e.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="font-bold text-amber-600 text-xs sm:text-sm">
                            +{formatCurrency(e.price || 0)}
                          </span>
                          {isActive && (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-400 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>

      <div className="flex gap-2 sm:gap-3 shrink-0">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 border border-stone-300 rounded-xl font-bold text-stone-600 hover:bg-stone-100 text-xs sm:text-sm"
          >
            Voltar
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="flex-1 py-2.5 sm:py-3 bg-orange-700 text-white rounded-xl font-bold disabled:bg-stone-300 disabled:text-stone-500 text-xs sm:text-sm transition-colors"
          >
            Avançar
          </button>
        ) : (
          <button
            onClick={() => onFinish(order)}
            className="flex-1 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg text-xs sm:text-sm transition-transform active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" /> Adicionar à Sacola
          </button>
        )}
      </div>
    </div>
  );
}