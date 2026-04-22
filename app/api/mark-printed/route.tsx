import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import fs from "fs";
import path from "path";
import os from "os";

const QUEUE_FILE = path.join(os.tmpdir(), "casamacarrao_receipt_queue.json");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    // A. SE FOR RECIBO: Remove da fila de impressão segura
    if (id.includes("-RECIBO")) {
      if (fs.existsSync(QUEUE_FILE)) {
        const data = fs.readFileSync(QUEUE_FILE, "utf-8");
        let queue = JSON.parse(data);
        
        // Remove apenas o recibo que acabou de ser impresso
        queue = queue.filter((receipt: any) => receipt.id !== id);
        fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue), "utf-8");
      }
      return NextResponse.json({ success: true, message: "Recibo removido da fila." });
    }

    // B. SE FOR PEDIDO DE COZINHA: Marca como impresso no banco de dados
    const [result]: any = await pool.query(
      "UPDATE orders SET impresso = true WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao marcar como impresso:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}