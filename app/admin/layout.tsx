// app/admin/layout.tsx
import Link from "next/link";
import { 
  Package, 
  DollarSign, 
  UtensilsCrossed, 
  ShoppingCart, 
  LayoutDashboard, 
  ArrowLeft,
  ChefHat
} from "lucide-react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navItems = [
    { href: "/cozinha", label: "Cozinha", icon: ChefHat },
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
    { href: "/admin/menu", label: "Cardápio", icon: UtensilsCrossed },
    { href: "/admin/produtos", label: "Produtos", icon: Package },
    { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
  ];

  return (
    <div className="flex min-h-screen bg-stone-50 flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-stone-900 text-stone-300 border-r border-stone-800 md:min-h-screen p-4 flex flex-col">
        <div className="mb-6 md:mb-8 flex items-center justify-between md:block">
          <div>
            <h2 className="text-orange-500 font-bold text-xl tracking-wide">Painel Admin</h2>
            <p className="text-xs text-stone-500 uppercase tracking-widest mt-0.5">Casa do Macarrão</p>
          </div>
          <Link href="/" className="md:hidden text-stone-400 p-2 hover:bg-stone-800 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
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
        <div className="max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}