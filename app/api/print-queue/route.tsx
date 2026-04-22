import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import fs from "fs";
import path from "path";
import os from "os";

const QUEUE_FILE = path.join(os.tmpdir(), "casamacarrao_receipt_queue.json");

function getReceiptQueue() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      const data = fs.readFileSync(QUEUE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Erro ler fila:", e);
  }
  return [];
}

function saveReceiptQueue(queue: any[]) {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue), "utf-8");
  } catch (e) {
    console.error("Erro salvar fila:", e);
  }
}

async function getFormattingData() {
  const [sizesRows]: any = await pool.query("SELECT * FROM sizes");
  const [menuItemsRows]: any = await pool.query("SELECT id, name, price FROM menu_items");
  const [productsRows]: any = await pool.query("SELECT id, name, price FROM products");
  const [settingsRows]: any = await pool.query("SELECT extraPastaPrice, extraIngredientPrice, extraSaucePrice FROM store_settings WHERE id = 1");
  
  return {
    settings: settingsRows[0] || {},
    sizesMap: new Map<string, any>(sizesRows.map((s: any) => [s.id, s])),
    menuMap: new Map<string, any>(menuItemsRows.map((m: any) => [m.id, { name: m.name, price: Number(m.price || 0) }])),
    productsMap: new Map<string, any>(productsRows.map((p: any) => [p.id, { name: p.name, price: Number(p.price || 0) }]))
  };
}

function formatOrderForPrint(order: any, data: any) {
  const { settings, sizesMap, menuMap, productsMap } = data;
  const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
  const parsedProducts = typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []);

  const printItens: any[] = [];

  parsedItems.forEach((item: any) => {
    const sizeData: any = sizesMap.get(item.sizeId);
    const sizeName = sizeData ? sizeData.name : "Tamanho Custom";
    let itemTotal = sizeData ? Number(sizeData.price || 0) : 0;

    const massasArray = item.pastas ? item.pastas : (item.pastaId ? [item.pastaId] : []);
    const massas = massasArray.map((id: string) => menuMap.get(id)).filter(Boolean);
    const molhos = (item.sauces || []).map((id: string) => menuMap.get(id)).filter(Boolean);
    const temperos = (item.temperos || item.seasonings || []).map((id: string) => menuMap.get(id)).filter(Boolean);
    const ingredientes = (item.ingredients || []).map((id: string) => menuMap.get(id)).filter(Boolean);
    const extras = (item.extras || []).map((id: string) => menuMap.get(id)).filter(Boolean);

    if (sizeData) {
        const qtdPastas = massasArray.length;
        const qtdIngredients = (item.ingredients || []).length;
        const qtdSauces = (item.sauces || []).length;

        if (!sizeData.strictMaxPastas && qtdPastas > sizeData.maxPastas) {
            itemTotal += (qtdPastas - sizeData.maxPastas) * Number(settings.extraPastaPrice || 0);
        }
        if (!sizeData.strictMaxIngredients && qtdIngredients > sizeData.maxIngredients) {
            itemTotal += (qtdIngredients - sizeData.maxIngredients) * Number(settings.extraIngredientPrice || 0);
        }
        if (!sizeData.strictMaxSauces && qtdSauces > sizeData.maxSauces) {
            itemTotal += (qtdSauces - sizeData.maxSauces) * Number(settings.extraSaucePrice || 0);
        }
    }

    extras.forEach((extra: any) => { itemTotal += extra.price; });
    if (item.extraCheese) itemTotal += 3.0;

    let descricao = `Montagem: ${sizeName}`;
    if (massas.length) descricao += `\n  - Massas: ${massas.map((m: any) => m.name).join(', ')}`;
    if (molhos.length) descricao += `\n  - Molhos: ${molhos.map((m: any) => m.name).join(', ')}`;
    if (temperos.length) descricao += `\n  - Temp: ${temperos.map((m: any) => m.name).join(', ')}`;
    if (ingredientes.length) descricao += `\n  - Ingred: ${ingredientes.map((m: any) => m.name).join(', ')}`;
    if (extras.length) descricao += `\n  - Extras: ${extras.map((m: any) => m.name).join(', ')}`;
    if (item.extraCheese) descricao += `\n  - ** COM QUEIJO EXTRA **`;

    printItens.push({ quantidade: 1, nome: descricao, preco: itemTotal });
  });

  parsedProducts.forEach((prod: any) => {
    const productData: any = productsMap.get(prod.productId);
    const pName = productData ? productData.name : "Produto Avulso";
    const pPrice = productData ? productData.price : 0;
    printItens.push({ quantidade: prod.quantity || 1, nome: pName, preco: pPrice });
  });

  if (order.serviceFee > 0) {
    printItens.push({ quantidade: 1, nome: "Taxa de Serviço (10%)", preco: order.serviceFee });
  }

  return {
    id: order.isReceipt ? `${order.id}-RECIBO` : order.id,
    idCurto: String(order.id).split('-')[0].toUpperCase(),
    tipoPedido: order.tipoPedido || "delivery",
    cliente: order.customerName || "Cliente",
    telefone: order.phone || "Sem Telefone",
    endereco: order.address || "Balcão",
    observacao: order.observation || "",
    total: Number(order.total || 0),
    itens: printItens,
    metodoPagamento: order.paymentMethod || "Não informado",
    isPaid: order.isPaid === 1 || order.isPaid === true,
    isReceipt: order.isReceipt || false
  };
}

export async function GET() {
  try {
    const [ordersRows]: any = await pool.query(
      "SELECT * FROM orders WHERE status = 'aprovado' AND impresso = false ORDER BY createdAt ASC"
    );

    // Agora o GET só lê a fila, não a apaga! O Spooler vai apagá-la no mark-printed.
    const receiptsToPrint = getReceiptQueue();

    const data = await getFormattingData();
    const formattedOrders = ordersRows.map((order: any) => formatOrderForPrint(order, data));

    return NextResponse.json([...formattedOrders, ...receiptsToPrint]);
  } catch (error) {
    console.error("Erro GET print-queue:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await getFormattingData();
    
    body.isReceipt = true;
    const formattedReceipt = formatOrderForPrint(body, data);
    
    const queue = getReceiptQueue();
    const alreadyExists = queue.find((r: any) => r.id === formattedReceipt.id);
    
    if (!alreadyExists) {
        queue.push(formattedReceipt);
        saveReceiptQueue(queue);
    }

    return NextResponse.json({ success: true, message: "Enviado para a impressora!" });
  } catch (error) {
    console.error("Erro POST print-queue:", error);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}