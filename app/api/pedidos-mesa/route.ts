import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = 'force-dynamic'; // Evita cache no Next.js

export async function GET() {
  try {
    // 1. Busca os pedidos ativos (Mudei de 'aprovado' para pegar todos os não-finalizados)
    const [ordersRows]: any = await pool.query(
      "SELECT * FROM orders WHERE status NOT IN ('entregue', 'cancelado') ORDER BY createdAt ASC"
    );

    if (!ordersRows || ordersRows.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Busca os dicionários e preços atuais do banco
    const [sizesRows]: any = await pool.query("SELECT * FROM sizes");
    const [menuItemsRows]: any = await pool.query("SELECT id, name, price FROM menu_items");
    const [productsRows]: any = await pool.query("SELECT id, name, price FROM products");
    const [settingsRows]: any = await pool.query("SELECT extraPastaPrice, extraIngredientPrice, extraSaucePrice, extraCheesePrice FROM store_settings WHERE id = 1");
    
    const settings: any = settingsRows[0] || {};

    // 3. Monta mapas na memória com tipagem <string, any> para matar os erros do TypeScript
    const sizesMap = new Map<string, any>(sizesRows.map((s: any) => [String(s.id), s]));
    const menuMap = new Map<string, any>(menuItemsRows.map((m: any) => [String(m.id), { name: m.name, price: Number(m.price || 0) }]));
    const productsMap = new Map<string, any>(productsRows.map((p: any) => [String(p.id), { name: p.name, price: Number(p.price || 0) }]));

    const formattedOrders = ordersRows.map((order: any) => {
      const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
      const parsedProducts = typeof order.products === 'string' ? JSON.parse(order.products || '[]') : (order.products || []);

      const printItens: any[] = [];

      // A. Traduz as Montagens (Custom Pastas)
      parsedItems.forEach((item: any) => {
        const sId = String(item.sizeId || item?.size?.id || "");
        const sizeData: any = sizesMap.get(sId); // Tipagem forçada
        const sizeName = sizeData ? sizeData.name : "Tamanho Custom";
        
        let itemTotal = sizeData ? Number(sizeData.price || 0) : 0;

        const extractIds = (arr: any[]) => (arr || []).map((x: any) => String(typeof x === 'object' ? x.id : x));
        
        const massas: any[] = extractIds(item.pastas).map((id: string) => menuMap.get(id)).filter(Boolean);
        const molhos: any[] = extractIds(item.sauces).map((id: string) => menuMap.get(id)).filter(Boolean);
        const temperos: any[] = extractIds(item.seasonings || item.temperos).map((id: string) => menuMap.get(id)).filter(Boolean);
        const ingredientes: any[] = extractIds(item.ingredients).map((id: string) => menuMap.get(id)).filter(Boolean);
        const extras: any[] = extractIds(item.extras).map((id: string) => menuMap.get(id)).filter(Boolean);

        // Calcula adicionais passando pela regra do sizeData
        if (sizeData) {
            const qtdPastas = massas.length;
            const qtdIngredients = ingredientes.length;
            const qtdSauces = molhos.length;

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

        const extrasText: string[] = [];
        extras.forEach((ex: any) => {
            itemTotal += ex.price;
            extrasText.push(`${ex.name} [R$ ${ex.price.toFixed(2)}]`);
        });

        if (item.extraCheese) {
            const cheesePrice = Number(settings.extraCheesePrice || 8.00);
            itemTotal += cheesePrice;
            extrasText.push(`Queijo Extra [R$ ${cheesePrice.toFixed(2)}]`);
        }

        let descricao = `Montagem: ${sizeName}`;
        if (massas.length) descricao += `   - Massas: ${massas.map((m: any) => m.name).join(', ')}`;
        if (molhos.length) descricao += `   - Molhos:\n${molhos.map((m: any) => m.name).join(', ')}`;
        if (ingredientes.length) descricao += `   -\nIngred: ${ingredientes.map((m: any) => m.name).join(', ')}`;
        if (temperos.length) descricao += `   -\nTemp: ${temperos.map((m: any) => m.name).join(', ')}`;
        if (extrasText.length) descricao += `\n- Extras: ${extrasText.join(', ')}`;

        printItens.push({
          quantidade: Number(item.quantity || item.qty || 1),
          nome: descricao,
          preco: itemTotal
        });
      });

      // B. Traduz os Produtos Fechados
      parsedProducts.forEach((prod: any) => {
        const pId = String(prod.productId || prod.id || "");
        const productData: any = productsMap.get(pId);
        const pName = productData ? productData.name : "Produto Avulso";
        const pPrice = productData ? productData.price : 0;
        
        printItens.push({
          quantidade: Number(prod.quantity || prod.qty || 1),
          nome: pName,
          preco: pPrice
        });
      });

      return {
        id: order.id,
        idCurto: String(order.id).split('-')[0].toUpperCase(),
        tipoPedido: order.tipoPedido || "mesa",
        cliente: order.customerName || "Cliente Padrão",
        telefone: order.phone || "Sem Telefone",
        endereco: order.address || "Mesa",
        observacao: order.observation || "",
        total: Number(order.total || 0),
        itens: printItens,
        metodoPagamento: order.paymentMethod || "Não informado",
        isPaid: order.isPaid === 1 || order.isPaid === true,
        status: order.status,
        createdAt: order.createdAt
      };
    });

    // 4. Filtra apenas os que são Mesas
    const mesasOrders = formattedOrders.filter((o: any) => {
      const addr = String(o.endereco).trim().toLowerCase();
      // Garante que só entrega as mesas (seja pelo tipo ou pelo endereço ter "mesa" ou apenas número)
      return o.tipoPedido === 'mesa' || addr.startsWith('mesa') || /^\d+$/.test(addr);
    });

    return NextResponse.json(mesasOrders);

  } catch (error) {
    console.error("Erro ao buscar pedidos das mesas:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}