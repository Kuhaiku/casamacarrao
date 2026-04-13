// app/page.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, ShoppingBag, ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";

// Importando seus novos Componentes
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
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [cartAvulsos, setCartAvulsos] = useState<{ id: string; productId: string; product: any; quantity: number }[]>([]);
  const [cartSelfService, setCartSelfService] = useState<any[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [payment, setPayment] = useState<"pix" | "dinheiro">("pix");
  const [observation, setObservation] = useState("");

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
      const catProducts = products.filter((p) => p.categoryId === cat.id && p.isActive);
      if (catProducts.length > 0) grouped[cat.name] = catProducts;
    });
    return grouped;
  }, [products, productCategories]);

  const formatCurrency = (value: number) => (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleAddAvulso = (produto: any) => {
    setCartAvulsos((prev) => {
      const existing = prev.find((item) => item.productId === produto.id);
      if (existing) return prev.map((item) => item.productId === produto.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { id: Date.now().toString(), productId: produto.id, product: produto, quantity: 1 }];
    });
  };

  const handleRemoveAvulso = (cartId: string) => setCartAvulsos((prev) => prev.filter((item) => item.id !== cartId));
  const handleAddSelfService = (macarrao: any) => { setCartSelfService((prev) => [...prev, { ...macarrao, id: Date.now().toString() }]); setView("menu"); };
  const handleRemoveSelfService = (cartId: string) => setCartSelfService((prev) => prev.filter((item) => item.id !== cartId));

  const handleFinalize = () => {
    if (!customerName.trim() || !phone.trim() || !address.trim() || !addressNumber.trim() || totalItemsCount === 0) return;
    const finalAddress = `${address.trim()}, Nº ${addressNumber.trim()}`;
    const trackingId = crypto.randomUUID();

    addOrder({
      id: trackingId, customerName: customerName.trim(), phone: phone.trim(), address: finalAddress, paymentMethod: payment,
      items: cartSelfService, products: cartAvulsos.map((p) => ({ productId: p.productId, quantity: p.quantity })),
      observation, total: cartTotal, status: "novo", isPaid: false, isAccounted: false,
    });
    router.push(`/pedido/${trackingId}`);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Seu navegador não suporta geolocalização.");
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const road = data.address.road || "";
            const suburb = data.address.suburb || data.address.neighbourhood || "";
            const city = data.address.city || data.address.town || "";
            const formattedAddress = `${road}${suburb ? `, ${suburb}` : ""}${city ? ` - ${city}` : ""}`.replace(/^,\s*/, '');
            setAddress(formattedAddress || data.display_name);
            setAddressNumber(""); 
          }
        } catch (error) { alert("Erro ao buscar o endereço."); } finally { setIsFetchingLocation(false); }
      },
      (err) => { setIsFetchingLocation(false); alert("Não foi possível pegar sua localização."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50 animate-in fade-in duration-300">
        <div className="relative flex flex-col items-center justify-center animate-pulse">
          <img src="/icon.svg" alt="Casa do Macarrão" className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-xl mb-6" />
          <h1 className="text-2xl sm:text-3xl font-black text-orange-600 tracking-wider text-center">CASA DO MACARRÃO</h1>
          <p className="text-stone-500 mt-2 font-medium text-sm">Preparando o cardápio...</p>
        </div>
      </div>
    );
  }

  // Agrupando propriedades para injetar na Sidebar
  const cartProps = {
    cartTotal, totalItemsCount, cartSelfService, cartAvulsos, isCartEmpty: totalItemsCount === 0,
    customerName, phone, address, addressNumber, observation, payment,
    setCustomerName, setPhone, setAddress, setAddressNumber, setObservation, setPayment,
    handleGetLocation, isFetchingLocation, handleFinalize, handleRemoveSelfService, handleRemoveAvulso,
    sizes, settings, menuItems, formatCurrency, setIsMobileCartOpen
  };

  return (
    <div className="flex h-screen bg-stone-50 font-sans overflow-hidden animate-in fade-in duration-500">
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isMobileCartOpen ? "hidden lg:flex" : "flex w-full"}`}>
        <div className="bg-stone-900 text-white px-4 sm:px-6 py-4 sm:py-6 shadow-md z-20 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-700 rounded-full flex items-center justify-center shrink-0">
                <ChefHat className="w-6 h-6 sm:w-7 sm:h-7 text-orange-100" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">Casa do Macarrão</h1>
                <p className="text-stone-400 text-[10px] sm:text-xs uppercase tracking-widest">Self-service & Mais</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden bg-stone-50 px-4 py-3 border-b border-stone-200 z-10 shadow-sm shrink-0">
          <button onClick={() => setIsMobileCartOpen(true)} className={`w-full rounded-2xl p-3 shadow-md flex items-center justify-between transition-all duration-300 ${cartBump ? "bg-orange-600 text-white scale-[1.02] ring-4 ring-orange-500/30" : "bg-stone-900 text-white active:scale-[0.98]"}`}>
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <ShoppingBag className={`w-5 h-5 transition-transform ${cartBump ? "animate-bounce text-white" : "text-stone-200"}`} />
                {totalItemsCount > 0 && <span className={`absolute -top-2 -right-2 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-stone-900 ${cartBump ? "bg-white text-orange-600 border-orange-600" : "bg-orange-600 text-white"}`}>{totalItemsCount}</span>}
              </div>
              <div className="text-left flex flex-col">
                <span className="font-bold text-sm tracking-wide">Minha Sacola</span>
                <span className={`text-xs transition-colors ${cartBump ? "text-orange-100" : "text-stone-400"}`}>{totalItemsCount} item(s)</span>
              </div>
            </div>
            <span className={`font-black text-base transition-colors ${cartBump ? "text-white" : "text-orange-500"}`}>{formatCurrency(cartTotal)}</span>
          </button>
        </div>

        <main className="flex-1 max-w-3xl mx-auto w-full p-4 lg:p-8 overflow-y-auto pb-8">
          {view === "menu" ? (
            <MenuView itemsBySection={itemsBySection} formatCurrency={formatCurrency} setView={setView} handleAddAvulso={handleAddAvulso} />
          ) : (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300 mt-2 lg:mt-0">
              <button onClick={() => setView("menu")} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold text-orange-700 mb-4 sm:mb-6 hover:text-orange-800">
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