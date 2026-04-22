// app/mesa/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChefHat,
  ShoppingBag,
  Plus,
  ArrowRight,
  Trash2,
  MapPin,
  ArrowLeft,
  Check,
  AlertCircle,
  Lock,
  Unlock,
  Star
} from "lucide-react";
import { useStore } from "@/lib/store";
import { OrderHistoryWidget } from "@/components/customer/floating-order-button";

function MesaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    sync,
    sizes,
    menuItems,
    products,
    productCategories,
    settings,
    addOrder,
    calculateOrderTotal,
  } = useStore();

  const [view, setView] = useState<"menu" | "builder">("menu");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Controle do feedback visual da sacola
  const [cartBump, setCartBump] = useState(false);

  const [cartAvulsos, setCartAvulsos] = useState<
    { id: string; productId: string; product: any; quantity: number }[]
  >([]);
  const [cartSelfService, setCartSelfService] = useState<any[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [mesa, setMesa] = useState("");
  const [observation, setObservation] = useState("");
  const [isMesaLocked, setIsMesaLocked] = useState(false);

  const cartTotal = calculateOrderTotal(cartSelfService, cartAvulsos);
  const totalItemsCount = cartAvulsos.reduce((acc, i) => acc + i.quantity, 0) + cartSelfService.length;
  const prevItemsCount = useRef(totalItemsCount);

  useEffect(() => {
    sync();
    setIsMounted(true);

    const urlMesa = searchParams.get("n") || searchParams.get("mesa");
    if (urlMesa) {
      setMesa(urlMesa);
      setIsMesaLocked(true);
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [sync, searchParams]);

  // Efeito disparado quando a quantidade de itens aumenta
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
      const catProducts = products.filter(
        (p) => p.categoryId === cat.id && p.isActive,
      );
      if (catProducts.length > 0) grouped[cat.name] = catProducts;
    });
    return grouped;
  }, [products, productCategories]);

  const handleAddAvulso = (produto: any) => {
    setCartAvulsos((prev) => {
      const existing = prev.find((item) => item.productId === produto.id);
      if (existing)
        return prev.map((item) =>
          item.productId === produto.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      return [
        ...prev,
        {
          id: Date.now().toString(),
          productId: produto.id,
          product: produto,
          quantity: 1,
        },
      ];
    });
  };

  const handleRemoveAvulso = (cartId: string) =>
    setCartAvulsos((prev) => prev.filter((item) => item.id !== cartId));
  
  const handleAddSelfService = (macarrao: any) => {
    setCartSelfService((prev) => [
      ...prev,
      { ...macarrao, id: Date.now().toString() },
    ]);
    setView("menu");
  };
  
  const handleRemoveSelfService = (cartId: string) =>
    setCartSelfService((prev) => prev.filter((item) => item.id !== cartId));

  const handleFinalize = () => {
    if (!customerName || !mesa || totalItemsCount === 0) return;

    const trackingId = crypto.randomUUID();

    addOrder({
      id: trackingId,
      customerName,
      phone: "Não informado",
      address: `Mesa ${mesa}`, 
      paymentMethod: "dinheiro" as any,
      items: cartSelfService,
      products: cartAvulsos.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
      })),
      observation,
      total: cartTotal,
      status: "novo",
      isPaid: false,
      isAccounted: false,
    } as any);

    router.push(`/pedido/${trackingId}`);
  };

  const formatCurrency = (value: number) =>
    (value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const getItemName = (id: string) => {
    const item = menuItems?.find((m: any) => m.id === id);
    return item ? item.name : "Item";
  };

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50 animate-in fade-in duration-300">
        <div className="relative flex flex-col items-center justify-center animate-pulse">
          <img
            src="/icon.svg"
            alt="Casa do Macarrão"
            className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-xl mb-6"
          />
          <h1 className="text-2xl sm:text-3xl font-black text-orange-600 tracking-wider text-center">
            PEDIDO NA MESA
          </h1>
          <p className="text-stone-500 mt-2 font-medium text-sm">
            Preparando o cardápio...
          </p>
        </div>
      </div>
    );
  }

  const renderCartContent = () => {
    const isCartEmpty = totalItemsCount === 0;
    return (
      <div className="flex flex-col h-full bg-stone-50 w-full overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between shrink-0 z-10 shadow-sm w-full">
          <div>
            <h2 className="text-lg font-black text-stone-800 flex items-center gap-2 truncate">
              <ShoppingBag className="w-5 h-5 text-orange-600 shrink-0" /> <span className="truncate">Sua Sacola</span>
            </h2>
            <p className="text-xs font-bold text-stone-400 mt-0.5">
              {totalItemsCount} item(s)
            </p>
          </div>
          <button
            onClick={() => setIsMobileCartOpen(false)}
            className="lg:hidden text-stone-600 font-bold px-3 py-1.5 text-[11px] uppercase bg-stone-100 rounded-lg active:scale-95 shrink-0"
          >
            Fechar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isCartEmpty ? (
            <div className="text-center py-16 text-stone-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Sua sacola está vazia.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {cartSelfService.map((item: any) => {
                const size = sizes.find((s: any) => s.id === item.sizeId);
                let sub = size?.price || 0;
                
                if (size) {
                  if (!size.strictMaxIngredients) sub += Math.max(0, item.ingredients.length - size.maxIngredients) * (settings.extraIngredientPrice || 0);
                  if (!size.strictMaxSauces) sub += Math.max(0, item.sauces.length - size.maxSauces) * (settings.extraSaucePrice || 0);
                  if (!size.strictMaxPastas && item.pastas?.length) sub += Math.max(0, item.pastas.length - size.maxPastas) * (settings.extraPastaPrice || 0);
                  
                  item.extras?.forEach((extId: string) => {
                    const extraItem = menuItems.find((m: any) => m.id === extId);
                    if (extraItem && extraItem.price) sub += extraItem.price;
                  });
                  
                  if (item.extraCheese) sub += 3.0;
                }

                return (
                  <div key={item.id} className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm space-y-3 w-full">
                    <div className="flex justify-between items-start border-b border-stone-100 pb-2 gap-2">
                      <span className="font-black text-stone-800 text-sm">
                        Macarrão {size?.name}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="font-semibold text-stone-700 text-sm">{formatCurrency(sub)}</span>
                        <button onClick={() => handleRemoveSelfService(item.id)} className="text-stone-400 hover:text-red-500 bg-red-50/50 p-1.5 rounded-lg transition-colors shrink-0">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    {/* DESCRIÇÃO COMPLETA DO PEDIDO (Igual ao Delivery) */}
                    <div className="text-[12px] text-stone-600 leading-snug space-y-1.5 pl-2 border-l-2 border-orange-200 break-words">
                      {item.pastaId && <div><span className="font-bold text-stone-400">Massa:</span> {getItemName(item.pastaId)}</div>}
                      {item.sauces?.length > 0 && <div><span className="font-bold text-stone-400">Molhos:</span> {item.sauces.map(getItemName).join(', ')}</div>}
                      {item.temperos?.length > 0 && <div><span className="font-bold text-stone-400">Temperos:</span> {item.temperos.map(getItemName).join(', ')}</div>}
                      {item.ingredients?.length > 0 && <div><span className="font-bold text-stone-400">Ingredientes:</span> {item.ingredients.map(getItemName).join(', ')}</div>}
                      {item.extras?.length > 0 && <div className="text-amber-700"><span className="font-bold text-amber-500">Extras:</span> {item.extras.map(getItemName).join(', ')}</div>}
                    </div>
                  </div>
                );
              })}
              
              {cartAvulsos.length > 0 && (
                <div className="space-y-2 w-full">
                  <h3 className="font-black text-stone-800 text-sm mt-2 ml-1">Itens Avulsos</h3>
                  {cartAvulsos.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-stone-200 shadow-sm gap-2">
                      <span className="text-sm font-bold text-stone-700 min-w-0 break-words flex-1">
                        {item.quantity}x {item.product.name}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="font-semibold text-stone-700 text-sm">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                        <button onClick={() => handleRemoveAvulso(item.id)} className="text-stone-400 hover:text-red-500 p-1.5 rounded-lg bg-red-50/50 shrink-0">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div 
          className="bg-white border-t border-stone-200 shrink-0 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] px-4 pt-4 w-full"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex justify-between items-center mb-3 px-1 w-full">
            <span className="text-sm font-bold text-stone-500 uppercase">Total Estimado</span>
            <span className={`text-2xl font-black ${isCartEmpty ? "text-stone-400" : "text-stone-800"} shrink-0`}>
              {formatCurrency(cartTotal)}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2 w-full">
              <input
                type="text"
                placeholder="Seu Nome (Ex: João)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isCartEmpty}
                className="flex-1 min-w-0 border-b py-2 text-[16px] sm:text-sm outline-none focus:border-orange-600 bg-transparent disabled:opacity-60"
              />
              
              <div className="relative shrink-0">
                <input
                  type="text"
                  placeholder="Mesa"
                  value={mesa ? `Mesa ${mesa.replace('Mesa ', '')}` : ''}
                  onChange={(e) => setMesa(e.target.value)}
                  disabled={isMesaLocked || isCartEmpty}
                  className={`w-24 border-b py-2 text-[16px] sm:text-sm outline-none pr-8 text-center bg-transparent font-bold transition-all ${
                    isMesaLocked ? "text-red-600 border-red-300" : "text-stone-800 focus:border-orange-600"
                  } disabled:opacity-100`}
                />
                {(searchParams.get("n") || searchParams.get("mesa")) && (
                  <button
                    type="button"
                    onClick={() => setIsMesaLocked(!isMesaLocked)}
                    disabled={isCartEmpty}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-white rounded-md hover:bg-stone-100"
                  >
                    {isMesaLocked ? <Lock className="w-4 h-4 text-red-600" /> : <Unlock className="w-4 h-4 text-stone-400" />}
                  </button>
                )}
              </div>
            </div>

            <textarea
              placeholder="Observação (Ex: Sem cebola...)"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              disabled={isCartEmpty}
              rows={2}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-[16px] sm:text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white resize-none"
            />

            <button
              onClick={handleFinalize}
              disabled={isCartEmpty || !customerName || !mesa}
              className="w-full py-4 rounded-2xl text-white font-black text-[15px] bg-green-600 hover:bg-green-700 disabled:bg-stone-300 disabled:text-stone-500 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
            >
              ENVIAR PEDIDO <ArrowRight className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    );
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

      <div className={`flex-1 flex flex-col h-full w-full transition-all duration-300 relative ${isMobileCartOpen ? "hidden lg:flex" : "flex"}`}>
        
        {/* Cabeçalhos Fixos */}
        <div className="flex flex-col shrink-0 w-full z-20">
          <div className="bg-stone-900 text-white px-4 sm:px-6 py-4 sm:py-6 shadow-md">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-700 rounded-full flex items-center justify-center shrink-0">
                  <ChefHat className="w-6 h-6 sm:w-7 sm:h-7 text-orange-100" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                    Casa do Macarrão
                  </h1>
                  <p className="text-orange-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Pedido Local {mesa ? `(Mesa ${mesa.replace('Mesa ', '')})` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sacola Fixa no Topo (Mobile) com Feedback e Preço Discreto */}
          <div className="lg:hidden w-full bg-stone-50 border-b border-stone-200 p-3 sm:p-4 shadow-sm z-10">
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className={`w-full rounded-2xl p-3 flex items-center justify-between transition-all duration-300 shadow-md border-2
                ${cartBump 
                  ? 'bg-green-600 border-green-500 text-white scale-[1.02]' 
                  : 'bg-stone-900 border-stone-900 text-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <ShoppingBag className={`w-5 h-5 transition-transform duration-300 ${cartBump ? 'scale-125' : 'text-stone-200'}`} />
                  {totalItemsCount > 0 && !cartBump && (
                    <span className="absolute -top-2 -right-2 bg-orange-600 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-stone-900">
                      {totalItemsCount}
                    </span>
                  )}
                </div>
                <div className="text-left flex flex-col">
                  <span className="font-bold text-sm tracking-wide">
                    {cartBump ? "Adicionado com Sucesso!" : "Minha Sacola"}
                  </span>
                  {!cartBump && <span className="text-stone-400 text-[11px]">{totalItemsCount} item(s)</span>}
                </div>
              </div>
              
              {cartTotal > 0 && !cartBump && (
                <span className="font-semibold text-stone-300 text-xs bg-white/10 px-2 py-1 rounded-lg tracking-wide">
                  {formatCurrency(cartTotal)}
                </span>
              )}
            </button>
          </div>
        </div>

        <main className="flex-1 max-w-3xl mx-auto w-full p-4 lg:p-8 overflow-y-auto pb-28 lg:pb-8">
          {view === "menu" ? (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section>
                <div className="mb-2 sm:mb-3 mt-2 lg:mt-0">
                  <h2 className="text-base sm:text-lg font-bold text-stone-800">Self-Service</h2>
                  <p className="text-[11px] sm:text-xs text-stone-500">Monte o macarrão com seus ingredientes favoritos.</p>
                </div>
                <button
                  onClick={() => setView("builder")}
                  className="w-full text-left bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg hover:scale-[1.01] transition-transform"
                >
                  <div className="flex justify-between items-center">
                    <div className="pr-2">
                      <h3 className="text-xl sm:text-2xl font-black mb-0.5 sm:mb-1">Montar Macarrão</h3>
                      <p className="text-orange-200 text-xs sm:text-sm font-medium leading-snug">Você escolhe tudo do seu jeito</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0">
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </button>
              </section>

              {Object.entries(itemsBySection).map(([category, prods]) => (
                <section key={category}>
                  <div className="mb-2 sm:mb-3">
                    <h2 className="text-base sm:text-lg font-bold text-stone-800 capitalize">{category}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {prods.map((produto) => (
                      <div key={produto.id} className="bg-white border border-stone-200 rounded-xl p-3 sm:p-4 flex items-center justify-between hover:border-orange-300 transition-colors">
                        <div className="flex-1 pr-3">
                          <h4 className="font-bold text-stone-800 text-sm leading-tight">{produto.name}</h4>
                          <p className="text-orange-700 font-bold mt-1 text-sm">{formatCurrency(produto.price)}</p>
                        </div>
                        <button onClick={() => handleAddAvulso(produto)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors shrink-0">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300 mt-2 lg:mt-0">
              <button onClick={() => setView("menu")} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold text-orange-700 mb-4 sm:mb-6 hover:text-orange-800">
                <ArrowLeft className="w-4 h-4" /> Voltar ao Cardápio
              </button>
              <OrderBuilder db={{ sizes, menuItems, settings }} onFinish={handleAddSelfService} formatCurrency={formatCurrency} />
            </div>
          )}
        </main>
        
        {/* Histórico Fixo na Base (Mobile) */}
        <div 
          className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-stone-200 z-40 px-4 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
           <OrderHistoryWidget isMobile={true} />
        </div>
      </div>

      {/* SACOLA LATERAL DESKTOP (Ou tela cheia se aberta no mobile) */}
      <aside className={`w-full lg:w-[380px] xl:w-[420px] h-[100dvh] bg-white shrink-0 z-50 flex-col shadow-2xl border-l border-stone-200 
        ${isMobileCartOpen ? "flex fixed inset-0 lg:static" : "hidden lg:flex"}`}
      >
        {renderCartContent()}
      </aside>

      {/* Widget flutuante para Desktop */}
      <div className="hidden lg:block">
        <OrderHistoryWidget />
      </div>
    </div>
  );
}

function OrderBuilder({ db, onFinish, formatCurrency }: any) {
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
    if (!selectedSize.strictMaxSauces)
      currentTotal += Math.max(0, order.sauces.length - selectedSize.maxSauces) * (db.settings.extraSaucePrice || 0);
    if (!selectedSize.strictMaxIngredients)
      currentTotal += Math.max(0, order.ingredients.length - selectedSize.maxIngredients) * (db.settings.extraIngredientPrice || 0);
    
    order.extras.forEach((extId: string) => {
      const extraItem = db.menuItems.find((m:any) => m.id === extId);
      if(extraItem && extraItem.price) currentTotal += extraItem.price;
    });
  }

  const massas = db.menuItems.filter((i: any) => i.isActive && i.category === "pasta");
  const molhos = db.menuItems.filter((i: any) => i.isActive && i.category === "sauce");
  const temperos = db.menuItems.filter((i: any) => i.isActive && i.category === "seasoning");
  const ingredientes = db.menuItems.filter((i: any) => i.isActive && i.category === "ingredient");
  const extras = db.menuItems.filter((i: any) => i.isActive && i.category === "extra");

  return (
    <div className="max-w-xl mx-auto w-full flex flex-col">
      {selectedSize && (
        <div className="sticky top-0 z-20 mb-4 bg-stone-900 rounded-xl px-4 py-3 flex items-center justify-between shadow-lg shrink-0">
          <div>
            <p className="text-stone-400 text-[10px] sm:text-xs">Macarrão {selectedSize.name}</p>
            <p className="text-white text-lg sm:text-xl font-bold">{formatCurrency(currentTotal)}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap w-full shrink-0">
        {STEPS.map((name, i) => (
          <div key={i} className="flex items-center shrink-0">
            <div className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${i < step ? "bg-green-600 text-white" : i === step ? "bg-orange-700 text-white" : "bg-stone-200 text-stone-500"}`}>
              {i < step && <Check className="w-3 h-3 inline mr-1" />}
              {name}
            </div>
            {i < STEPS.length - 1 && <div className={`w-3 sm:w-4 h-0.5 mx-1 ${i < step ? "bg-green-500" : "bg-stone-300"}`} />}
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
                <button key={sz.id} onClick={() => setOrd({ sizeId: sz.id })} className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all ${order.sizeId === sz.id ? "border-orange-600 bg-orange-50" : "border-stone-200 hover:border-orange-300 bg-white"}`}>
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
                <button key={m.id} onClick={() => setOrd({ pastaId: m.id })} className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center min-h-[90px] ${order.pastaId === m.id ? "border-orange-600 bg-orange-50" : "border-stone-200 hover:border-orange-300 bg-white"}`}>
                  <span className="text-xl sm:text-2xl block mb-1 sm:mb-2">🍝</span>
                  <span className={`text-[11px] sm:text-sm font-bold leading-tight ${order.pastaId === m.id ? "text-orange-900" : "text-stone-700"}`}>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg sm:text-xl font-bold text-stone-800">Molhos</h2>
              <span className="text-[10px] sm:text-xs font-bold bg-stone-100 px-2 py-1 rounded-full text-stone-600">{order.sauces.length}/{selectedSize?.maxSauces}</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mb-3 sm:mb-4">Adicionais custam {formatCurrency(db.settings.extraSaucePrice || 0)}.</p>
            {order.sauces.length > (selectedSize?.maxSauces || 1) && !selectedSize?.strictMaxSauces && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 sm:p-3 rounded-xl flex items-center gap-2 mb-4 text-[11px] sm:text-sm font-medium">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" /> Molhos extras (+{formatCurrency((order.sauces.length - selectedSize!.maxSauces) * (db.settings.extraSaucePrice || 0))})
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {molhos.map((m: any) => {
                const isActive = order.sauces.includes(m.id);
                return (
                  <button key={m.id} onClick={() => { if (isActive) setOrd({ sauces: order.sauces.filter((id) => id !== m.id) }); else if (!selectedSize?.strictMaxSauces || order.sauces.length < selectedSize.maxSauces) setOrd({ sauces: [...order.sauces, m.id] }); }} className={`p-3 sm:p-4 rounded-xl border-2 text-center relative transition-all flex flex-col items-center justify-center min-h-[90px] ${isActive ? "border-red-600 bg-red-50" : "border-stone-200 hover:border-red-300 bg-white"}`}>
                    <span className="text-xl sm:text-2xl block mb-1 sm:mb-2">🥫</span>
                    <span className={`text-[11px] sm:text-sm font-bold leading-tight ${isActive ? "text-red-900" : "text-stone-700"}`}>{m.name}</span>
                    {isActive && <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
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
                  <button key={t.id} onClick={() => { if (isActive) setOrd({ temperos: order.temperos.filter((id) => id !== t.id) }); else setOrd({ temperos: [...order.temperos, t.id] }); }} className={`p-2.5 sm:p-3 rounded-xl border-2 text-center relative transition-all flex flex-col items-center justify-center min-h-[70px] ${isActive ? "border-green-600 bg-green-50" : "border-stone-200 hover:border-green-300 bg-white"}`}>
                    <span className="text-lg sm:text-xl block mb-1">🌿</span>
                    <span className={`text-[10px] sm:text-xs font-bold leading-tight ${isActive ? "text-green-900" : "text-stone-700"}`}>{t.name}</span>
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
              <span className="text-[10px] sm:text-xs font-bold bg-stone-100 px-2 py-1 rounded-full text-stone-600">{order.ingredients.length}/{selectedSize?.maxIngredients}</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mb-3 sm:mb-4">Adicionais custam {formatCurrency(db.settings.extraIngredientPrice || 0)}.</p>
            
            {order.ingredients.length > (selectedSize?.maxIngredients || 4) && !selectedSize?.strictMaxIngredients && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 sm:p-3 rounded-xl flex items-center gap-2 mb-4 text-[11px] sm:text-sm font-medium">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" /> Ingredientes extras (+{formatCurrency((order.ingredients.length - selectedSize!.maxIngredients) * (db.settings.extraIngredientPrice || 0))})
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-6">
              {ingredientes.map((i: any) => {
                const isActive = order.ingredients.includes(i.id);
                return (
                  <button key={i.id} onClick={() => { if (isActive) setOrd({ ingredients: order.ingredients.filter((id) => id !== i.id) }); else if (!selectedSize?.strictMaxIngredients || order.ingredients.length < selectedSize.maxIngredients) setOrd({ ingredients: [...order.ingredients, i.id] }); }} className={`p-2.5 sm:p-3 rounded-xl border-2 text-center relative transition-all min-h-[50px] flex items-center justify-center ${isActive ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-amber-300 bg-white"}`}>
                    <span className={`text-[10px] sm:text-xs font-bold leading-tight ${isActive ? "text-amber-900" : "text-stone-700"}`}>{i.name}</span>
                    {isActive && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white"><Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" /></div>}
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
                        className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all ${isActive ? "border-amber-400 bg-amber-50" : "border-stone-200 hover:border-amber-300 bg-white"}`}
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
        {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="px-4 sm:px-6 py-2.5 sm:py-3 border border-stone-300 rounded-xl font-bold text-stone-600 hover:bg-stone-100 text-xs sm:text-sm">Voltar</button>}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()} className="flex-1 py-2.5 sm:py-3 bg-orange-700 text-white rounded-xl font-bold disabled:bg-stone-300 disabled:text-stone-500 text-xs sm:text-sm transition-colors">Avançar</button>
        ) : (
          <button onClick={() => onFinish(order)} className="flex-1 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg text-xs sm:text-sm transition-transform active:scale-95">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" /> Adicionar à Sacola
          </button>
        )}
      </div>
    </div>
  );
}

export default function MesaPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-stone-50 text-orange-600 font-bold">Carregando Cardápio...</div>}>
      <MesaContent />
    </Suspense>
  );
}