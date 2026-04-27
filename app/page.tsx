"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, ShoppingBag, ArrowLeft, AlertCircle, Check, Volume2, VolumeX } from "lucide-react";
import { useStore } from "@/lib/store";
import { MenuView } from "@/components/customer/menu-view";
import { OrderBuilder } from "@/components/customer/order-builder";
import { CartSidebar } from "@/components/customer/cart-sidebar";
import { OrderHistoryWidget } from "@/components/customer/floating-order-button";

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

  // ==========================================
  // ESTADOS E REFS DA MÚSICA DE FUNDO
  // ==========================================
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const interactionDone = useRef(false);

  const cartTotal = calculateOrderTotal(cartSelfService, cartAvulsos);
  const totalItemsCount = cartAvulsos.reduce((acc, i) => acc + i.quantity, 0) + cartSelfService.length;
  const prevItemsCount = useRef(totalItemsCount);

  useEffect(() => {
    sync();
    setIsMounted(true);
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [sync]);

  // ==========================================
  // LÓGICA DO PLAYER DE MÚSICA DE FUNDO
  // ==========================================
  useEffect(() => {
    // Forçamos o type as any temporariamente para acessar as configs de áudio sem erro no TS
    const bgSettings = settings as any;
    const url = bgSettings?.bgMusicUrl;
    const isActiveByDefault = bgSettings?.bgMusicActive;

    if (!url) return;

    // Se o áudio não existir, criamos a instância
    if (!audioRef.current) {
      const audio = new Audio(url);
      audio.loop = true; // Define para tocar em loop eternamente
      audioRef.current = audio;
    } else if (audioRef.current.src !== window.location.origin + url) {
      // Atualiza o arquivo caso mude a URL no Admin
      audioRef.current.src = url;
    }

    const handleFirstInteraction = () => {
      if (interactionDone.current) return;
      
      interactionDone.current = true; // Marca que o usuário já tocou na tela

      // Se estiver configurada para tocar por padrão, tenta dar o play no primeiro toque
      if (isActiveByDefault && audioRef.current) {
        audioRef.current.play()
          .then(() => setIsMusicPlaying(true))
          .catch((e) => console.log("Autoplay bloqueado pelo navegador:", e));
      }

      // Removemos os ouvintes para não pesar a memória
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    window.addEventListener('scroll', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
    };
  }, [(settings as any)?.bgMusicUrl, (settings as any)?.bgMusicActive]);

  // Função para o botão manual do cliente
  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => console.log("Erro ao forçar play."));
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (totalItemsCount > prevItemsCount.current) {
      setCartBump(false); 
      setTimeout(() => setCartBump(true), 10);
      timer = setTimeout(() => setCartBump(false), 2000); 
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
    <div className="flex flex-col lg:flex-row h-[100dvh] w-full bg-stone-50 font-sans overflow-hidden animate-in fade-in duration-500 relative">
      
      {/* FEEDBACK VISUAL FLUTUANTE */}
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

      {/* COLUNA PRINCIPAL */}
      <div className={`flex-1 flex flex-col h-full w-full transition-all duration-300 relative ${isMobileCartOpen ? "hidden lg:flex" : "flex"}`}>
        
        {/* CABEÇALHOS */}
        <div className="flex flex-col shrink-0 w-full z-20">
          {settings.isOpen === false && (
            <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5" /> Nosso delivery está fora de atendimento no momento
            </div>
          )}

          <div className="bg-stone-900 text-white px-4 sm:px-6 py-4 sm:py-6 shadow-md">
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

          <div className="lg:hidden w-full bg-stone-50 border-b border-stone-200 p-3 sm:p-4 shadow-sm z-10">
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
        </div>

        <main className="flex-1 w-full max-w-3xl mx-auto p-4 lg:p-8 overflow-y-auto pb-28 lg:pb-8 relative">
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

          {/* BOTÃO FLUTUANTE DA MÚSICA DO CLIENTE */}
          {(settings as any)?.bgMusicUrl && (
            <button 
              onClick={toggleMusic}
              title={isMusicPlaying ? "Pausar música" : "Tocar música"}
              className="fixed bottom-[88px] lg:bottom-6 left-4 z-40 bg-white/80 backdrop-blur-md p-2.5 rounded-full shadow-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
            >
              {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-50" />}
            </button>
          )}
        </main>

        <div 
          className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-stone-200 z-40 px-4 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <OrderHistoryWidget isMobile={true} />
        </div>
      </div>

      <aside className={`w-full lg:w-[380px] xl:w-[420px] h-[100dvh] bg-white shrink-0 z-50 flex-col shadow-2xl border-l border-stone-200 
        ${isMobileCartOpen ? "flex fixed inset-0 lg:static" : "hidden lg:flex"}`}
      >
        <CartSidebar {...cartProps} />
      </aside>

      <div className="hidden lg:block">
        <OrderHistoryWidget />
      </div>

    </div>
  );
}
