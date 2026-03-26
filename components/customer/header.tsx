"use client"

import Link from "next/link"
import { Package, Settings } from "lucide-react"

export function CustomerHeader() {
  return (
    <header className="border-b bg-card">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl text-foreground">Casa do Macarrão</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/cozinha"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cozinha
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
