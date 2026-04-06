// app/admin/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verifyAdminPassword } from "@/lib/actions";
import {
  Package,
  DollarSign,
  UtensilsCrossed,
  ShoppingCart,
  LayoutDashboard,
  ArrowLeft,
  ChefHat,
} from "lucide-react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // Verifica se a sessão atual já foi autenticada antes
      const isAuth = sessionStorage.getItem("casamacarrao_admin_auth");
      if (isAuth === "true") {
        setIsAuthenticated(true);
        return;
      }

      // Dispara o alerta padrão do navegador solicitando a senha
      const password = window.prompt(
        "🔒 Acesso Restrito. Digite a senha do administrador:",
      );

      // Se cancelar o alerta ou deixar vazio, volta pro site
      if (!password) {
        router.push("/");
        return;
      }

      // Valida a senha no servidor (via lib/actions.ts)
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

  // Tela de bloqueio temporária enquanto verifica a senha
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 font-medium">
        Verificando segurança...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-stone-50 flex-col md:flex-row animate-in fade-in duration-500">
      <aside className="w-full md:w-64 bg-stone-900 text-stone-300 border-r border-stone-800 md:min-h-screen p-4 flex flex-col">
        <div className="mb-6 md:mb-8 flex items-center justify-between md:block">
          <div>
            <h2 className="text-orange-500 font-bold text-xl tracking-wide">
              Painel Admin
            </h2>
            <p className="text-xs text-stone-500 uppercase tracking-widest mt-0.5">
              Casa do Macarrão
            </p>
          </div>
          <Link
            href="/"
            className="md:hidden text-stone-400 p-2 hover:bg-stone-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-800 hover:text-white transition-colors whitespace-nowrap"
            >
              <item.icon className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-8 hidden md:block">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Site
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
