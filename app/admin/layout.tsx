// app/admin/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { verifyAdminPassword } from "@/lib/actions";
import {
  Package,
  DollarSign,
  UtensilsCrossed,
  ShoppingCart,
  LayoutDashboard,
  ChefHat,
  LogOut,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = sessionStorage.getItem("casamacarrao_admin_auth");
      if (isAuth === "true") {
        setIsAuthenticated(true);
        return;
      }

      const password = window.prompt(
        "🔒 Acesso Restrito. Digite a senha do administrador:",
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

  const navItems = [
    { href: "/cozinha", label: "Cozinha", icon: ChefHat },
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
    { href: "/admin/menu", label: "Cardápio", icon: UtensilsCrossed },
    { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
    // { href: "/admin/produtos", label: "Produtos", icon: Package },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 font-medium">
        Verificando segurança...
      </div>
    );
  }

  return (
    <SidebarProvider>
      {/* A barra lateral agora recebe a cor escura diretamente no contêiner interno via Tailwind 
        para não sofrer interferência de variáveis de cor globais.
      */}
      <Sidebar 
        collapsible="icon" 
        className="border-r border-stone-800 text-stone-300 [&>[data-sidebar=sidebar]]:bg-stone-900"
      >
        {/* CABEÇALHO (h-14 para alinhar com o cabeçalho branco) */}
        <SidebarHeader className="p-3 border-b border-stone-800 flex h-14 items-center justify-center">
          {/* Visão Aberta */}
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
          
          {/* Visão Fechada (Apenas Ícone) */}
          <div className="hidden group-data-[collapsible=icon]:flex w-full justify-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-600 text-white font-bold text-sm">
              CM
            </div>
          </div>
        </SidebarHeader>

        {/* MENUS */}
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

        {/* RODAPÉ */}
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

      {/* ÁREA DE CONTEÚDO (h-svh e overflow-hidden forçam a rolagem apenas no <main>) */}
      <SidebarInset className="flex-1 flex flex-col bg-stone-50 w-full animate-in fade-in duration-500 h-svh overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-stone-200 px-4 bg-white shadow-sm shrink-0">
          <SidebarTrigger className="text-stone-500 hover:text-stone-900" />
          <div className="w-px h-4 bg-stone-200 mx-1"></div>
          <h1 className="text-sm font-semibold text-stone-600">
            {navItems.find(item => item.href === pathname)?.label || "Gerenciamento"}
          </h1>
        </header>
        
        {/* Aqui é onde a rolagem acontece (overflow-y-auto) */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}