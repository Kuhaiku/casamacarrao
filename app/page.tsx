"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, ShoppingBag, ArrowLeft, AlertCircle, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { MenuView } from "@/components/customer/menu-view";
import { OrderBuilder } from "@/components/customer/order-builder";
import { CartSidebar } from "@/components/customer/cart-sidebar";
import { FloatingOrderButton } from "@/components/customer/floating-order-button";

export default function CustomerHome() {
  const router = useRouter();
  const { sync, sizes, menuItems, products, productCategories, settings, addOrder, calculateOrderTotal } = useStore();

  const [view, setView] = useState<"menu" | "builder">("menu");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para controlar a animação de feedback
  const [cartBump, setCartBump] = useState(false);

  const [cartAvulsos, setCartAvulsos] = useState<any[]>([]);
  const [cartSelfService, setCartSelfService] = useState<any[]>([]);

  const cartTotal = calculateOrderTotal(cartSelfService, cartAvulsos);
  const totalItemsCount = cartAvulsos.reduce((acc, i) => acc + i.quantity, 0) + cartSelfService.length;
  const prevItemsCount = useRef(totalItemsCount);

  useEffect(() => {
    sync();
    setIsMounted(true);
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [sync]);

  // Lógica otimizada para o Feedback Visual
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (totalItemsCount > prevItemsCount.current) {
      setCartBump(false); // Reseta para garantir que a animação reinicie se clicar rápido
      setTimeout(() => setCartBump(true), 10);
      timer = setTimeout(() => setCartBump(false), 2000); // Fica na tela por 2 segundos
    }
    prevItemsCount.current = totalItemsCount;
    
    return () => clearTimeout(timer);
  }, [totalItemsCount]);

  const itemsBySection = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    const activeCats = productCategories.filter((c) => c.isActive);
    activeCats.forEach((cat) => {
      const catProducts = products.filter((p) => p.categoryId === cat.id && p.isActive);
      if (catProducts.length > 0) grouped[cat.name] = catProducts;
    });
    return grouped;
  }, [products, productCategories]);

  const formatCurrency = (value: number) => (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleAddAvulso = (produto: any) => {
    if (settings.isOpen === false) return; 
    setCartAvulsos((prev) => {
      const existing = prev.find((item) => item.productId === produto.id);
      if (existing) return prev.map((item) => item.productId === produto.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { id: crypto.randomUUID(), productId: produto.id, product: produto, quantity: 1 }];
    });
  };

  const handleAddSelfService = (macarrao: any) => { 
    if (settings.isOpen === false) return; 
    setCartSelfService((prev) => [...prev, { ...macarrao, id: crypto.randomUUID() }]); 
    setView("menu"); 
  };

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50 animate-in fade-in duration-300">
        <div className="relative flex flex-col items-center justify-center animate-pulse">
          <img src="/icon.svg" alt="Casa do Macarrão" className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-xl mb-6" />
          <h1 className="text-2xl sm:text-3xl font-black text-orange-600 tracking-wider text-center">CASA DO MACARRÃO</h1>
        </div>
      </div>
    );
  }

  const cartProps = {
    cartSubtotal: cartTotal,
    totalItemsCount, cartSelfService, cartAvulsos,
    handleRemoveSelfService: (id: string) => setCartSelfService(p => p.filter(i => i.id !== id)),
    handleRemoveAvulso: (id: string) => setCartAvulsos(p => p.filter(i => i.id !== id)),
    sizes, settings, menuItems, products, formatCurrency, setIsMobileCartOpen, addOrder, router
  };

  return (
    <div className="flex h-[100dvh] bg-stone-50 font-sans overflow-hidden animate-in fade-in duration-500 relative">
      
      {/* FEEDBACK VISUAL FLUTUANTE GLOBAL (Mobile & Desktop) */}
      <div 
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 pointer-events-none flex items-center justify-center
        ${cartBump ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95'}`}
      >
        <div className="bg-green-600 text-white pl-2 pr-6 py-2 rounded-full shadow-[0_10px_40px_rgba(22,163,74,0.4)] flex items-center gap-3 font-black tracking-wide border-2 border-green-400">
          <div className="bg-white text-green-600 p-1.5 rounded-full shadow-sm">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
          <span className="drop-shadow-sm text-sm">ITEM ADICIONADO!</span>
        </div>
      </div>

      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isMobileCartOpen ? "hidden lg:flex" : "flex w-full"}`}>
        
        {settings.isOpen === false && (
          <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-2 font-bold text-sm z-30 shrink-0">
            <AlertCircle className="w-5 h-5" /> Nosso delivery está fora de atendimento no momento
          </div>
        )}

        <div className="bg-stone-900 text-white px-4 sm:px-6 py-4 sm:py-6 shadow-md z-20 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 bg-orange-700 rounded-full flex items-center justify-center shrink-0">
                <ChefHat className="w-6 h-6 text-orange-100" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Casa do Macarrão</h1>
                <p className="text-stone-400 text-[10px] uppercase tracking-widest">Apenas Delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTÃO MOBILE DA SACOLA COM FEEDBACK VISUAL */}
        <div className="lg:hidden bg-stone-50 px-4 py-3 border-b border-stone-200 z-10 shadow-sm shrink-0">
          <button 
            onClick={() => setIsMobileCartOpen(true)} 
            className={`w-full rounded-2xl p-3 flex items-center justify-between transition-all duration-300 shadow-md border-2
              ${cartBump 
                ? 'bg-green-600 border-green-500 text-white scale-[1.02]' 
                : 'bg-stone-900 border-stone-900 text-white'}`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className={`w-5 h-5 transition-transform duration-300 ${cartBump ? 'scale-125' : 'text-stone-200'}`} />
              <span className="font-bold text-sm tracking-wide">
                {cartBump ? "Adicionado com Sucesso!" : `Minha Sacola (${totalItemsCount})`}
              </span>
            </div>
            {cartTotal > 0 && !cartBump && (
              <span className="font-black bg-white/10 px-2 py-1 rounded-lg text-xs tracking-wider">
                {formatCurrency(cartTotal)}
              </span>
            )}
          </button>
        </div>

        <main className="flex-1 max-w-3xl mx-auto w-full p-4 lg:p-8 overflow-y-auto pb-8">
          {view === "menu" ? (
            <MenuView itemsBySection={itemsBySection} formatCurrency={formatCurrency} setView={setView} handleAddAvulso={handleAddAvulso} isOpen={settings.isOpen} />
          ) : (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300 mt-2 lg:mt-0">
              <button onClick={() => setView("menu")} className="flex items-center gap-1 text-sm font-bold text-orange-700 mb-6 hover:text-orange-800">
                <ArrowLeft className="w-4 h-4" /> Voltar ao Cardápio
              </button>
              <OrderBuilder db={{ sizes, menuItems, settings }} onFinish={handleAddSelfService} formatCurrency={formatCurrency} />
            </div>
          )}
        </main>
      </div>

      <aside className="hidden lg:flex w-[380px] xl:w-[420px] h-full border-l border-stone-200 shadow-2xl z-20 flex-col bg-white shrink-0">
        <CartSidebar {...cartProps} />
      </aside>

      {/* TELA DA SACOLA NO MOBILE */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden flex flex-col bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="flex-1" onClick={() => setIsMobileCartOpen(false)}></div>
          <div className="h-[90dvh] bg-white rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full flex flex-col">
            <CartSidebar {...cartProps} />
          </div>
        </div>
      )}

      {/* NOVO: BOTÃO FLUTUANTE DE HISTÓRICO DE PEDIDO */}
      <FloatingOrderButton />
    </div>
  );
}