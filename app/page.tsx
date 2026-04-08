// app/page.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  ShoppingBag,
  Plus,
  ArrowRight,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowLeft,
  Check,
  AlertCircle,
  Star
} from "lucide-react";
import { useStore } from "@/lib/store";

const PAY_META = {
  pix: { label: "PIX", icon: Smartphone },
  cartao: { label: "Cartão", icon: CreditCard },
  dinheiro: { label: "Dinheiro", icon: Banknote },
};

export default function CustomerHome() {
  const router = useRouter();

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

  // Estado para o feedback visual da sacola
  const [cartBump, setCartBump] = useState(false);

  const [cartAvulsos, setCartAvulsos] = useState<
    { id: string; productId: string; product: any; quantity: number }[]
  >([]);
  const [cartSelfService, setCartSelfService] = useState<any[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("pix");
  const [observation, setObservation] = useState("");

  const cartTotal = calculateOrderTotal(cartSelfService, cartAvulsos);
  const totalItemsCount = cartAvulsos.reduce((acc, i) => acc + i.quantity, 0) + cartSelfService.length;

  const prevItemsCount = useRef(totalItemsCount);

  useEffect(() => {
    sync();
    setIsMounted(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [sync]);

  // Efeito para acionar a animação sempre que um item for adicionado
  useEffect(() => {
    if (totalItemsCount > prevItemsCount.current) {
      setCartBump(true);
      const timer = setTimeout(() => setCartBump(false), 400);
      prevItemsCount.current = totalItemsCount;
      return () => clearTimeout(timer);
    } else {
      prevItemsCount.current = totalItemsCount;
    }
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
    if (!customerName || !phone || !address || totalItemsCount === 0) return;

    const trackingId = crypto.randomUUID();

    addOrder({
      id: trackingId,
      customerName,
      phone,
      address,
      paymentMethod: payment,
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
    });

    router.push(`/pedido/${trackingId}`);
  };

  const formatCurrency = (value: number) =>
    (value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

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
            CASA DO MACARRÃO
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
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-600" /> Sua Sacola
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {totalItemsCount} item(s)
            </p>
          </div>
          <button
            onClick={() => setIsMobileCartOpen(false)}
            className="lg:hidden text-stone-500 font-medium p-2 text-sm bg-stone-200 rounded-lg"
          >
            Voltar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {isCartEmpty ? (
            <div className="text-center py-10 text-stone-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sua sacola está vazia.</p>
            </div>
          ) : (
            <>
              {cartSelfService.map((item: any) => {
                const size = sizes.find((s: any) => s.id === item.sizeId);
                let sub = size?.price || 0;
                
                // Recálculo dinâmico na sacola
                if (size) {
                  if (!size.strictMaxIngredients) sub += Math.max(0, item.ingredients.length - size.maxIngredients) * (settings.extraIngredientPrice || 0);
                  if (!size.strictMaxSauces) sub += Math.max(0, item.sauces.length - size.maxSauces) * (settings.extraSaucePrice || 0);
                  if (!size.strictMaxPastas && item.pastas?.length) sub += Math.max(0, item.pastas.length - size.maxPastas) * (settings.extraPastaPrice || 0);
                  
                  item.extras?.forEach((extId: string) => {
                    const extraItem = menuItems.find((m: any) => m.id === extId);
                    if (extraItem && extraItem.price) sub += extraItem.price;
                  });
                  
                  if (item.extraCheese) sub += 3.0; // Mantém para pedidos antigos
                }

                return (
                  <div
                    key={item.id}
                    className="flex justify-between items-start border-b border-stone-100 pb-3"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-stone-800 text-sm leading-tight">
                        Macarrão {size?.name}
                      </p>
                      <p className="text-[11px] sm:text-xs text-stone-500 mt-1 leading-snug">
                        {
                          menuItems.find((m: any) => m.id === item.pastaId)
                            ?.name
                        }{" "}
                        •{" "}
                        {item.sauces
                          ?.map(
                            (sId: string) =>
                              menuItems.find((m: any) => m.id === sId)?.name,
                          )
                          .join(", ")}
                      </p>
                      {item.extras?.length > 0 && (
                        <p className="text-[11px] text-amber-600 font-bold mt-0.5 flex items-center gap-1">
                          <Star className="w-3 h-3" /> {item.extras.map((eId: string) => menuItems.find((m:any) => m.id === eId)?.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="font-semibold text-stone-700 text-sm">
                        {formatCurrency(sub)}
                      </span>
                      <button
                        onClick={() => handleRemoveSelfService(item.id)}
                        className="text-stone-300 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {cartAvulsos.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b border-stone-100 pb-3"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-stone-800 text-sm leading-tight">
                      {item.quantity}x {item.product.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="font-semibold text-stone-700 text-sm">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => handleRemoveAvulso(item.id)}
                      className="text-stone-300 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 space-y-3 sm:space-y-4 shrink-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-bold text-stone-600">
              Total a Pagar
            </span>
            <span
              className={`text-xl sm:text-2xl font-black ${isCartEmpty ? "text-stone-400" : "text-orange-700"}`}
            >
              {formatCurrency(cartTotal)}
            </span>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <input
              type="text"
              placeholder="Seu Nome (Ex: João Silva)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={isCartEmpty}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none disabled:bg-stone-100 disabled:opacity-60"
            />
            <input
              type="tel"
              placeholder="Telefone / WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isCartEmpty}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none disabled:bg-stone-100 disabled:opacity-60"
            />
            <input
              type="text"
              placeholder="Endereço Completo de Entrega"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isCartEmpty}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none disabled:bg-stone-100 disabled:opacity-60"
            />
            <textarea
              placeholder="Observação (Ex: Troco para R$50, tirar azeitona...)"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              disabled={isCartEmpty}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none disabled:bg-stone-100 disabled:opacity-60 resize-none h-14"
            />

            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {Object.entries(PAY_META).map(([key, { label, icon: Icon }]) => (
                <button
                  key={key}
                  onClick={() => setPayment(key)}
                  disabled={isCartEmpty}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all disabled:opacity-50 ${payment === key && !isCartEmpty ? "border-orange-600 bg-orange-50 text-orange-700" : "border-stone-200 text-stone-500"}`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase">
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={handleFinalize}
              disabled={isCartEmpty || !customerName || !phone || !address}
              className="w-full py-3 sm:py-3.5 mt-2 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 disabled:bg-stone-300 disabled:text-stone-400 transition-colors"
            >
              Confirmar Pedido
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-stone-50 font-sans overflow-hidden animate-in fade-in duration-500">
      <div
        className={`flex-1 flex flex-col h-full transition-all duration-300 ${isMobileCartOpen ? "hidden lg:flex" : "flex w-full"}`}
      >
        <div className="bg-stone-900 text-white px-4 sm:px-6 py-4 sm:py-6 shadow-md z-20 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-700 rounded-full flex items-center justify-center shrink-0">
                <ChefHat className="w-6 h-6 sm:w-7 sm:h-7 text-orange-100" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                  Casa do Macarrão
                </h1>
                <p className="text-stone-400 text-[10px] sm:text-xs uppercase tracking-widest">
                  Self-service & Mais
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SACOLA MOBILE NO TOPO */}
        <div className="lg:hidden bg-stone-50 px-4 py-3 border-b border-stone-200 z-10 shadow-sm shrink-0">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className={`w-full rounded-2xl p-3 shadow-md flex items-center justify-between transition-all duration-300 ${
              cartBump
                ? "bg-orange-600 text-white scale-[1.02] ring-4 ring-orange-500/30"
                : "bg-stone-900 text-white active:scale-[0.98]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <ShoppingBag
                  className={`w-5 h-5 transition-transform ${cartBump ? "animate-bounce text-white" : "text-stone-200"}`}
                />
                {totalItemsCount > 0 && (
                  <span
                    className={`absolute -top-2 -right-2 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-stone-900 ${
                      cartBump ? "bg-white text-orange-600 border-orange-600" : "bg-orange-600 text-white"
                    }`}
                  >
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <div className="text-left flex flex-col">
                <span className="font-bold text-sm tracking-wide">Minha Sacola</span>
                <span
                  className={`text-xs transition-colors ${cartBump ? "text-orange-100" : "text-stone-400"}`}
                >
                  {totalItemsCount} item(s)
                </span>
              </div>
            </div>
            <span
              className={`font-black text-base transition-colors ${cartBump ? "text-white" : "text-orange-500"}`}
            >
              {formatCurrency(cartTotal)}
            </span>
          </button>
        </div>

        <main className="flex-1 max-w-3xl mx-auto w-full p-4 lg:p-8 overflow-y-auto pb-8">
          {view === "menu" ? (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section>
                <div className="mb-2 sm:mb-3 mt-2 lg:mt-0">
                  <h2 className="text-base sm:text-lg font-bold text-stone-800">
                    Self-Service
                  </h2>
                  <p className="text-[11px] sm:text-xs text-stone-500">
                    Monte o macarrão com seus ingredientes favoritos.
                  </p>
                </div>
                <button
                  onClick={() => setView("builder")}
                  className="w-full text-left bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg hover:scale-[1.01] transition-transform"
                >
                  <div className="flex justify-between items-center">
                    <div className="pr-2">
                      <h3 className="text-xl sm:text-2xl font-black mb-0.5 sm:mb-1">
                        Montar Macarrão
                      </h3>
                      <p className="text-orange-200 text-xs sm:text-sm font-medium leading-snug">
                        Você escolhe tudo do seu jeito
                      </p>
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
                    <h2 className="text-base sm:text-lg font-bold text-stone-800 capitalize">
                      {category}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {prods.map((produto) => (
                      <div
                        key={produto.id}
                        className="bg-white border border-stone-200 rounded-xl p-3 sm:p-4 flex items-center justify-between hover:border-orange-300 transition-colors"
                      >
                        <div className="flex-1 pr-3">
                          <h4 className="font-bold text-stone-800 text-sm leading-tight">
                            {produto.name}
                          </h4>
                          <p className="text-orange-700 font-bold mt-1 text-sm">
                            {formatCurrency(produto.price)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddAvulso(produto)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors shrink-0"
                        >
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
              <button
                onClick={() => setView("menu")}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold text-orange-700 mb-4 sm:mb-6 hover:text-orange-800"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar ao Cardápio
              </button>
              <OrderBuilder
                db={{ sizes, menuItems, settings }}
                onFinish={handleAddSelfService}
                formatCurrency={formatCurrency}
              />
            </div>
          )}
        </main>
      </div>

      <aside className="hidden lg:flex w-[380px] xl:w-[420px] h-full border-l border-stone-200 shadow-2xl z-20 flex-col bg-white shrink-0">
        {renderCartContent()}
      </aside>

      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div
            className="flex-1"
            onClick={() => setIsMobileCartOpen(false)}
          ></div>
          <div className="h-[90vh] bg-white rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full flex flex-col">
            {renderCartContent()}
          </div>
        </div>
      )}
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
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${i < step ? "bg-green-600 text-white" : i === step ? "bg-orange-700 text-white" : "bg-stone-200 text-stone-500"}`}
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
                  onClick={() => setOrd({ sizeId: sz.id })}
                  className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all ${order.sizeId === sz.id ? "border-orange-600 bg-orange-50" : "border-stone-200 hover:border-orange-300 bg-white"}`}
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
                  onClick={() => setOrd({ pastaId: m.id })}
                  className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center min-h-[90px] ${order.pastaId === m.id ? "border-orange-600 bg-orange-50" : "border-stone-200 hover:border-orange-300 bg-white"}`}
                >
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
                  <button
                    key={m.id}
                    onClick={() => {
                      if (isActive) setOrd({ sauces: order.sauces.filter((id) => id !== m.id) });
                      else if (!selectedSize?.strictMaxSauces || order.sauces.length < selectedSize.maxSauces) setOrd({ sauces: [...order.sauces, m.id] });
                    }}
                    className={`p-3 sm:p-4 rounded-xl border-2 text-center relative transition-all flex flex-col items-center justify-center min-h-[90px] ${isActive ? "border-red-600 bg-red-50" : "border-stone-200 hover:border-red-300 bg-white"}`}
                  >
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
                  <button
                    key={t.id}
                    onClick={() => {
                      if (isActive) setOrd({ temperos: order.temperos.filter((id) => id !== t.id) });
                      else setOrd({ temperos: [...order.temperos, t.id] });
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 text-center relative transition-all flex flex-col items-center justify-center min-h-[70px] ${isActive ? "border-green-600 bg-green-50" : "border-stone-200 hover:border-green-300 bg-white"}`}
                  >
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
                  <button
                    key={i.id}
                    onClick={() => {
                      if (isActive) setOrd({ ingredients: order.ingredients.filter((id) => id !== i.id) });
                      else if (!selectedSize?.strictMaxIngredients || order.ingredients.length < selectedSize.maxIngredients) setOrd({ ingredients: [...order.ingredients, i.id] });
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 text-center relative transition-all min-h-[50px] flex items-center justify-center ${isActive ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-amber-300 bg-white"}`}
                  >
                    <span className={`text-[10px] sm:text-xs font-bold leading-tight ${isActive ? "text-amber-900" : "text-stone-700"}`}>{i.name}</span>
                    {isActive && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white"><Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" /></div>}
                  </button>
                );
              })}
            </div>

            {/* AQUI ENTRA A RENDERIZAÇÃO DINÂMICA DOS ADICIONAIS EXTRAS (SUBSTITUINDO O QUEIJO FIXO) */}
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