import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // Usando o seu pool do mysql2
import { Order } from "@/lib/types";

export async function GET() {
  try {
    // Busca os pedidos aprovados e que não foram impressos (impresso = 0 ou false)
    const [rows] = await pool.query(
      "SELECT * FROM orders WHERE status = 'aprovado' AND impresso = false ORDER BY createdAt ASC"
    );

    // Força a tipagem do retorno do banco
    const pendingOrders = rows as any[];

    if (!pendingOrders || pendingOrders.length === 0) {
      return NextResponse.json([]);
    }

    const formattedOrders = pendingOrders.map((order: any) => {
      // Como você provavelmente salva os items como JSON no banco, fazemos o parse
      const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
      
      return {
        id: order.id,
        cliente: order.customerName || "Cliente",
        telefone: order.phone || "N/A",
        total: Number(order.total || 0),
        // Mapeia os itens garantindo tipagem para o TypeScript não reclamar
        itens: parsedItems.map((item: any) => ({
          // Como a sua estrutura de OrderItem é complexa (pastas, sauces, etc),
          // Enviamos uma string unificada ou montamos de forma simples pro Spooler ler
          quantidade: item.quantidade || 1,
          nome: item.nome || "Item do Pedido", // Ajuste conforme salva no banco
          preco: Number(item.preco || 0),
        })),
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Erro ao buscar fila de impressão:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}