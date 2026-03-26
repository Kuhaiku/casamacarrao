"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Settings, Package, Utensils, ClipboardList } from "lucide-react"

const navItems = [
  { href: "/admin", label: "Tamanhos e Regras", icon: Settings },
  { href: "/admin/menu", label: "Cardápio", icon: Utensils },
  { href: "/admin/orders", label: "Pedidos", icon: ClipboardList },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center gap-8 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-foreground">Casa do Macarrão</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">Admin</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="ml-auto">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver Loja
            </Link>
          </div>
        </div>
      </header>
      <main className="container py-8 px-4">{children}</main>
    </div>
  )
}
