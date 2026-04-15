import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do pedido é obrigatório" }, { status: 400 });
    }

    // Executa o update diretamente no MySQL usando o pool
    // Certifique-se de que a coluna 'impresso' existe na tabela 'orders' (tipo BOOLEAN ou TINYINT(1))
    await pool.query("UPDATE orders SET impresso = true WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: `Pedido ${id} marcado como impresso.` });
  } catch (error) {
    console.error("Erro ao atualizar status de impressão:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}