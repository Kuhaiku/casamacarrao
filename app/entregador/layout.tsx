// app/entregador/layout.tsx
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { verifyMotoboyPassword } from "@/lib/actions";

export default function EntregadorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = sessionStorage.getItem("casamacarrao_motoboy_auth");
      if (isAuth === "true") {
        setIsAuthenticated(true);
        return;
      }

      const password = window.prompt("🛵 Acesso do Entregador. Digite a senha:");
      
      if (!password) {
        router.push("/");
        return;
      }

      const isValid = await verifyMotoboyPassword(password);
      
      if (isValid) {
        sessionStorage.setItem("casamacarrao_motoboy_auth", "true");
        setIsAuthenticated(true);
      } else {
        alert("Senha incorreta!");
        router.push("/");
      }
    };

    checkAuth();
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 font-medium">
        Verificando acesso...
      </div>
    );
  }

  return <>{children}</>;
}