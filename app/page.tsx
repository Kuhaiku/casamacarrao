"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, ShoppingBag, ArrowLeft, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";

import { MenuView } from "@/components/customer/menu-view";
import { OrderBuilder } from "@/components/customer/order-builder";
import { CartSidebar } from "@/components/customer/cart-sidebar";

export default function CustomerHome() {
  const router = useRouter();
  const { sync, sizes, menuItems, products, productCategories, settings, addOrder, calculateOrderTotal } = useStore();

  const [view, setView] = useState<"menu" | "builder">("menu");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    if (totalItemsCount > prevItemsCount.current) {
      setCartBump(true);
      setTimeout(() => setCartBump(false), 400);
    }
    prevItemsCount.current = totalItemsCount;
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

  // Enviando Propriedades Limpas
  const cartProps = {
    cartSubtotal: cartTotal,
    totalItemsCount, cartSelfService, cartAvulsos,
    handleRemoveSelfService: (id: string) => setCartSelfService(p => p.filter(i => i.id !== id)),
    handleRemoveAvulso: (id: string) => setCartAvulsos(p => p.filter(i => i.id !== id)),
    sizes, settings, menuItems, products, formatCurrency, setIsMobileCartOpen, addOrder, router
  };

  return (
    <div className="flex h-screen bg-stone-50 font-sans overflow-hidden animate-in fade-in duration-500">
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

        <div className="lg:hidden bg-stone-50 px-4 py-3 border-b border-stone-200 z-10 shadow-sm shrink-0">
          <button onClick={() => setIsMobileCartOpen(true)} className="w-full rounded-2xl p-3 shadow-md flex items-center justify-between bg-stone-900 text-white">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-stone-200" />
              <span className="font-bold text-sm tracking-wide">Minha Sacola ({totalItemsCount})</span>
            </div>
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

      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="flex-1" onClick={() => setIsMobileCartOpen(false)}></div>
          <div className="h-[90vh] bg-white rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full flex flex-col">
            <CartSidebar {...cartProps} />
          </div>
        </div>
      )}
    </div>
  );
}