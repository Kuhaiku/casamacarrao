// app/cozinha/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { verifyAdminPassword } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader as SidebarHeaderUI,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  Check, 
  ChefHat, 
  Clock, 
  AlertCircle, 
  Star, 
  Columns, 
  LayoutGrid, 
  ChevronDown, 
  ChevronUp, 
  ChevronsUp, 
  ChevronsDown,
  Flame,
  Utensils,
  Volume2,
  VolumeX,
  BellRing,
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  DollarSign,
  LogOut
} from "lucide-react";

function normalizeDate(dateString: string) {
  if (!dateString) return new Date();
  
  let isoString = dateString.replace(" ", "T");
  
  if (!isoString.includes("Z") && !isoString.match(/[+-]\d{2}:?\d{2}$/)) {
    isoString += "Z";
  }
  
  return new Date(isoString);
}

function formatTime(dateString: string) {
  const date = normalizeDate(dateString);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function getTimeSince(dateString: string) {
  const date = normalizeDate(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}min`;
}

function getOrderType(address: string) {
  if (!address) return "ENTREGA";
  const trimmed = address.trim().toLowerCase();
  const isMesa = trimmed.startsWith("mesa") || /^\d+$/.test(trimmed);
  return isMesa ? "LOCAL" : "ENTREGA";
}

function playBell() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const frequencies = [1200, 1600, 2400];

    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime); 
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02); 
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5); 
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    });
  } catch (error) {
    console.error("Erro ao reproduzir alerta sonoro", error);
  }
}

function KitchenOrderCard({ order, isExpanded, onToggle }: { order: any; isExpanded: boolean; onToggle: () => void }) {
  const { updateOrderStatus, sizes, menuItems, products } = useStore();

  const getSizeName = (sizeId: string) =>
    sizes.find((s) => s.id === sizeId)?.name || "Tamanho Indefinido";
  const getItemName = (itemId: string) =>
    menuItems.find((i) => i.id === itemId)?.name || itemId;
  const getProductName = (prodId: string) =>
    products.find((p) => p.id === prodId)?.name || prodId;

  const orderType = getOrderType(order.address);

  const handleMarkAsReady = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (orderType === "LOCAL") {
      updateOrderStatus(order.id, "entregue");
    } else {
      updateOrderStatus(order.id, "pronto");
    }
  };

  const diffMinutes = Math.floor((Date.now() - normalizeDate(order.createdAt).getTime()) / 60000);
  let cardStyle = "border-primary/20 bg-card";
  let headerStyle = "bg-primary/5 border-primary/10";
  let timeBadgeStyle = "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200";

  if (diffMinutes >= 25) {
    cardStyle = "border-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-red-500/20";
    headerStyle = "bg-red-100 dark:bg-red-900/40 border-b border-red-200 dark:border-red-800";
    timeBadgeStyle = "bg-red-600 text-white dark:bg-red-700 animate-pulse";
  } else if (diffMinutes >= 15) {
    cardStyle = "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 shadow-amber-400/20";
    headerStyle = "bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800";
    timeBadgeStyle = "bg-amber-500 text-white dark:bg-amber-600";
  }

  return (
    <Card className={`border-2 flex flex-col transition-all duration-200 shadow-md ${cardStyle} ${isExpanded ? 'h-full' : ''}`}>
      <CardHeader 
        className={`pb-3 cursor-pointer hover:opacity-80 transition-opacity select-none ${headerStyle}`}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-stone-800 dark:text-stone-100">
              {order.customerName}
            </CardTitle>
            
            <div className="flex items-center gap-2 mt-2 mb-3 font-medium">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-bold">{formatTime(order.createdAt)}</span>
              <Badge className={`font-bold ${timeBadgeStyle} hover:${timeBadgeStyle}`}>
                {getTimeSince(order.createdAt)}
              </Badge>
            </div>

            {orderType === "LOCAL" ? (
              <span className="bg-blue-100 text-blue-800 border border-blue-300 font-black px-3 py-1.5 rounded-lg text-xs sm:text-sm uppercase flex items-center gap-2 w-fit shadow-sm">
                🍽️ Consumo no Local ({order.address})
              </span>
            ) : (
              <span className="bg-purple-100 text-purple-800 border border-purple-300 font-black px-3 py-1.5 rounded-lg text-xs sm:text-sm uppercase flex items-center gap-2 w-fit shadow-sm">
                🛵 Entrega
              </span>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <Badge
              variant="outline"
              className="text-lg px-3 py-1 font-black bg-white dark:bg-stone-900 border-stone-300"
            >
              #{order.id.slice(0, 4)}
            </Badge>
            <div className="text-stone-400 dark:text-stone-500 bg-black/5 dark:bg-white/5 p-1.5 rounded-lg">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4 space-y-4 flex-1 flex flex-col animate-in slide-in-from-top-2 fade-in duration-200">
          {order.items &&
            order.items.map((item: any, idx: number) => (
              <div
                key={`mac-${idx}`}
                className="p-4 bg-white/60 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-stone-700/50"
              >
                <div className="text-xl font-black mb-3 text-orange-600 dark:text-orange-500 uppercase tracking-wide">
                  Macarrão {getSizeName(item.sizeId)}
                </div>

                <div className="space-y-2 text-lg text-stone-700 dark:text-stone-300">
                  {item.pastaId && (
                    <div className="flex gap-2">
                      <span className="font-black min-w-[110px]">Massa:</span>
                      <span className="font-medium">
                        {getItemName(item.pastaId)}
                      </span>
                    </div>
                  )}

                  {item.sauces?.length > 0 && (
                    <div className="flex gap-2">
                      <span className="font-black min-w-[110px]">Molhos:</span>
                      <span className="font-medium">
                        {item.sauces.map(getItemName).join(", ")}
                      </span>
                    </div>
                  )}

                  {item.temperos?.length > 0 && (
                    <div className="flex gap-2">
                      <span className="font-black min-w-[110px]">Temperos:</span>
                      <span className="font-medium">
                        {item.temperos.map(getItemName).join(", ")}
                      </span>
                    </div>
                  )}

                  {item.ingredients?.length > 0 && (
                    <div className="flex gap-2">
                      <span className="font-black min-w-[110px]">Ingred.:</span>
                      <span className="font-medium">
                        {item.ingredients.map(getItemName).join(", ")}
                      </span>
                    </div>
                  )}

                  {item.extras?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-900 flex gap-2 text-amber-700 dark:text-amber-500">
                      <span className="font-black min-w-[110px] flex items-center gap-1">
                        <Star className="w-4 h-4" /> Extras:
                      </span>
                      <span className="font-black">
                        {item.extras.map(getItemName).join(", ")}
                      </span>
                    </div>
                  )}

                  {item.extraCheese && (
                    <div className="mt-3 inline-block bg-yellow-100 border-2 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-500 px-3 py-1 rounded-lg font-black text-lg shadow-sm">
                      + QUEIJO EXTRA
                    </div>
                  )}
                </div>
              </div>
            ))}

          {order.products && order.products.length > 0 && (
            <div className="p-4 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900">
              <div className="text-sm font-black mb-2 text-blue-800 dark:text-blue-400 uppercase tracking-wider">
                Outros Itens:
              </div>
              <div className="space-y-1.5">
                {order.products.map((prod: any, idx: number) => (
                  <div
                    key={`prod-${idx}`}
                    className="text-xl font-black text-blue-950 dark:text-blue-300 flex items-center gap-2"
                  >
                    <span className="bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded text-blue-900 dark:text-blue-100">
                      {prod.quantity}x
                    </span>
                    {getProductName(prod.productId)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.observation && (
            <div className="p-4 bg-amber-100/80 dark:bg-amber-950/50 rounded-xl border-2 border-amber-400 dark:border-amber-700 shadow-sm">
              <div className="text-sm font-black mb-2 text-amber-900 dark:text-amber-500 uppercase flex items-center gap-1.5 tracking-wider">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500" />{" "}
                Observação do Cliente:
              </div>
              <p className="text-xl font-bold text-amber-950 dark:text-amber-400 italic">
                "{order.observation}"
              </p>
            </div>
          )}

          <div className="flex-1"></div>

          <Button
            size="lg"
            className="w-full text-lg py-7 font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg transition-transform active:scale-[0.98] mt-4"
            onClick={handleMarkAsReady}
          >
            <Check className="h-7 w-7 mr-2" />
            {orderType === "LOCAL" ? "Marcar como Entregue" : "Marcar como Pronto"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

export default function KitchenPage() {
  const { orders, sync, sizes } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [splitView, setSplitView] = useState(false);
  
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [globalExpandMode, setGlobalExpandMode] = useState<'all_open' | 'all_closed' | 'oldest_open'>('all_open');
  
  const [knownOrders, setKnownOrders] = useState<string[]>([]);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  const navItems = [
    { href: "/cozinha", label: "Cozinha", icon: ChefHat },
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
    { href: "/admin/menu", label: "Cardápio", icon: UtensilsCrossed },
    { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = sessionStorage.getItem("casamacarrao_admin_auth");
      if (isAuth === "true") {
        setIsAuthenticated(true);
        return;
      }

      const password = window.prompt(
        "🔒 Acesso Restrito. Digite a senha do administrador:"
      );

      if (!password) {
        router.push("/");
        return;
      }

      const isValid = await verifyAdminPassword(password);

      if (isValid) {
        sessionStorage.setItem("casamacarrao_admin_auth", "true");
        setIsAuthenticated(true);
      } else {
        alert("Senha incorreta!");
        router.push("/");
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    sync();
    const interval = setInterval(() => {
      sync();
    }, 3000);
    return () => clearInterval(interval);
  }, [sync]);

  const approvedOrders = orders
    .filter((o) => o.status === "aprovado")
    .sort((a, b) => {
      const timeA = a.approvedAt ? normalizeDate(a.approvedAt).getTime() : normalizeDate(a.createdAt).getTime();
      const timeB = b.approvedAt ? normalizeDate(b.approvedAt).getTime() : normalizeDate(b.createdAt).getTime();
      return timeA - timeB;
    });

  useEffect(() => {
    const currentIds = approvedOrders.map(o => o.id);
    const hasNew = currentIds.some(id => !knownOrders.includes(id));

    if (hasNew && knownOrders.length > 0 && isSoundEnabled) {
      playBell(); 
    }
    
    if (currentIds.length !== knownOrders.length || hasNew) {
      setKnownOrders(currentIds);
    }
  }, [approvedOrders, knownOrders, isSoundEnabled]);

  const handleEnableSound = () => {
    setIsSoundEnabled(true);
    playBell();
  };

  const productionSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalItems = 0;
    
    approvedOrders.forEach((order) => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const sizeName = sizes.find((s) => s.id === item.sizeId)?.name || "Massa";
          counts[sizeName] = (counts[sizeName] || 0) + 1;
          totalItems++;
        });
      }
    });
    return { counts, totalItems };
  }, [approvedOrders, sizes]);

  const isExpanded = (id: string) => expandedMap[id] ?? true;

  const toggleOrder = (id: string) => {
    setExpandedMap(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const handleCycleGlobalExpand = () => {
    const nextMode =
      globalExpandMode === 'all_open' ? 'all_closed'
      : globalExpandMode === 'all_closed' ? 'oldest_open'
      : 'all_open';

    setGlobalExpandMode(nextMode);

    const newMap: Record<string, boolean> = { ...expandedMap };
    approvedOrders.forEach((order, idx) => {
      if (nextMode === 'all_open') {
        newMap[order.id] = true;
      } else if (nextMode === 'all_closed') {
        newMap[order.id] = false;
      } else if (nextMode === 'oldest_open') {
        newMap[order.id] = idx < 3;
      }
    });
    setExpandedMap(newMap);
  };

  const localOrders = approvedOrders.filter((o) => getOrderType(o.address) === "LOCAL");
  const deliveryOrders = approvedOrders.filter((o) => getOrderType(o.address) === "ENTREGA");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 font-medium">
        Verificando segurança...
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar 
        collapsible="icon" 
        className="border-r border-stone-800 text-stone-300 [&>[data-sidebar=sidebar]]:bg-stone-900 z-20"
      >
        <SidebarHeaderUI className="p-3 border-b border-stone-800 flex h-14 items-center justify-center">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden w-full px-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-600 text-white font-bold flex-shrink-0 text-sm">
              CM
            </div>
            <div className="flex flex-col">
              <h2 className="text-stone-100 font-bold text-sm tracking-wide leading-tight">
                Painel Admin
              </h2>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest leading-tight mt-0.5">
                Casa do Macarrão
              </p>
            </div>
          </div>
          
          <div className="hidden group-data-[collapsible=icon]:flex w-full justify-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-600 text-white font-bold text-sm">
              CM
            </div>
          </div>
        </SidebarHeaderUI>

        <SidebarContent>
          <SidebarMenu className="px-3 gap-1.5 mt-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    className={`h-10 transition-colors ${
                      isActive 
                        ? "bg-stone-800 text-white" 
                        : "text-stone-400 hover:bg-stone-800 hover:text-white"
                    }`}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon 
                        className={`w-5 h-5 flex-shrink-0 transition-colors ${
                          isActive ? "text-orange-500" : "text-stone-400 group-hover:text-orange-500"
                        }`} 
                      />
                      <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3 border-t border-stone-800">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Sair do Painel"
                className="h-10 text-stone-400 hover:bg-stone-800 hover:text-red-400 hover:bg-red-950/30 transition-colors"
              >
                <Link href="/" className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium group-data-[collapsible=icon]:hidden">
                    Sair do Painel
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex-1 flex flex-col bg-stone-100 dark:bg-stone-950 w-full h-svh overflow-hidden">
        <header className="border-b bg-white dark:bg-stone-900 shrink-0">
          <div className="container flex flex-col md:flex-row h-auto md:h-20 py-4 md:py-0 items-center justify-between px-4 max-w-[1400px] mx-auto gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <SidebarTrigger className="text-stone-500 hover:text-stone-900 dark:hover:text-white mr-1" />
              <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-xl">
                <ChefHat className="h-8 w-8 text-orange-600 dark:text-orange-500" />
              </div>
              <div>
                <h1 className="font-black text-2xl text-stone-800 dark:text-stone-100 leading-tight">
                  Cozinha
                </h1>
                <p className="text-sm font-bold text-stone-500">
                  Monitor de Preparo
                </p>
              </div>
              <Badge
                variant="secondary"
                className="ml-4 text-lg px-4 py-1 bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 font-black"
              >
                {approvedOrders.length} {approvedOrders.length === 1 ? "pedido" : "pedidos"}
              </Badge>
            </div>
            <nav className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
              
              {!isSoundEnabled ? (
                <Button
                  variant="destructive"
                  onClick={handleEnableSound}
                  className="font-bold animate-pulse shadow-md"
                >
                  <BellRing className="w-5 h-5 mr-2" /> Ativar Campainha
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 font-bold opacity-100"
                >
                  <Volume2 className="w-5 h-5 mr-2" /> Som Ativado
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleCycleGlobalExpand}
                className="bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 min-w-[210px] justify-center transition-all"
              >
                {globalExpandMode === 'all_open' && <><ChevronsUp className="w-5 h-5 mr-2 text-stone-600" /> Recolher Todos</>}
                {globalExpandMode === 'all_closed' && <><Flame className="w-5 h-5 mr-2 text-orange-600" /> Focar nos Próximos</>}
                {globalExpandMode === 'oldest_open' && <><ChevronsDown className="w-5 h-5 mr-2 text-green-600" /> Expandir Todos</>}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSplitView(!splitView)}
                className="bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700"
                title={splitView ? "Ver Tudo" : "Dividir Tela"}
              >
                {splitView ? <LayoutGrid className="w-5 h-5" /> : <Columns className="w-5 h-5" />}
              </Button>
            </nav>
          </div>

          {productionSummary.totalItems > 0 && (
            <div className="bg-orange-50 border-t border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/50 py-2.5 px-4">
              <div className="container max-w-[1400px] mx-auto flex items-center gap-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-500 font-black text-sm uppercase tracking-wider shrink-0">
                  <Utensils className="w-4 h-4" /> Em Produção:
                </div>
                <div className="flex gap-2">
                  {Object.entries(productionSummary.counts).map(([name, count]) => (
                    <Badge key={name} variant="outline" className="bg-white dark:bg-stone-900 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-400 font-bold px-3 py-1 text-sm whitespace-nowrap">
                      {count}x {name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto container py-8 px-4 max-w-[1400px] mx-auto">
          {approvedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800">
              <ChefHat className="h-28 w-28 text-stone-300 dark:text-stone-700 mb-6" />
              <h2 className="text-3xl font-black text-stone-400 dark:text-stone-600 mb-2">
                Nenhum pedido na fila
              </h2>
              <p className="text-lg text-stone-400 dark:text-stone-600 font-medium">
                Os pedidos aprovados aparecerão aqui automaticamente.
              </p>
            </div>
          ) : splitView ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-blue-100 border border-blue-300 dark:bg-blue-900/30 dark:border-blue-800 p-3 rounded-xl shadow-sm">
                  <span className="text-xl">🍽️</span>
                  <h2 className="text-xl font-black text-blue-900 dark:text-blue-100 uppercase">
                    Consumo no Local
                  </h2>
                  <Badge variant="secondary" className="ml-auto bg-white/50 text-blue-900">{localOrders.length}</Badge>
                </div>
                <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                  {localOrders.map((order) => (
                    <KitchenOrderCard 
                      key={order.id} 
                      order={order} 
                      isExpanded={isExpanded(order.id)} 
                      onToggle={() => toggleOrder(order.id)} 
                    />
                  ))}
                  {localOrders.length === 0 && (
                    <p className="text-stone-500 col-span-full text-center py-8">Nenhum pedido local na fila.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-purple-100 border border-purple-300 dark:bg-purple-900/30 dark:border-purple-800 p-3 rounded-xl shadow-sm">
                  <span className="text-xl">🛵</span>
                  <h2 className="text-xl font-black text-purple-900 dark:text-purple-100 uppercase">
                    Entrega
                  </h2>
                  <Badge variant="secondary" className="ml-auto bg-white/50 text-purple-900">{deliveryOrders.length}</Badge>
                </div>
                <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                  {deliveryOrders.map((order) => (
                    <KitchenOrderCard 
                      key={order.id} 
                      order={order} 
                      isExpanded={isExpanded(order.id)} 
                      onToggle={() => toggleOrder(order.id)} 
                    />
                  ))}
                  {deliveryOrders.length === 0 && (
                    <p className="text-stone-500 col-span-full text-center py-8">Nenhum pedido para entrega na fila.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
              {approvedOrders.map((order) => (
                <KitchenOrderCard 
                  key={order.id} 
                  order={order} 
                  isExpanded={isExpanded(order.id)} 
                  onToggle={() => toggleOrder(order.id)} 
                />
              ))}
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
