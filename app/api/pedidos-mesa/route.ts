import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    // 1. Busca os dicionários do banco
    const [sizesRows]: any = await pool.query("SELECT * FROM sizes");
    const [menuItemsRows]: any = await pool.query("SELECT id, name, price FROM menu_items");
    const [productsRows]: any = await pool.query("SELECT id, name, price FROM products");
    const [settingsRows]: any = await pool.query("SELECT extraPastaPrice, extraIngredientPrice, extraSaucePrice, extraCheesePrice FROM store_settings WHERE id = 1");

    const settings = settingsRows[0] || {};
    const sizesMap = new Map(sizesRows.map((s: any) => [String(s.id), s]));
    const menuMap = new Map(menuItemsRows.map((m: any) => [String(m.id), m]));
    const productsMap = new Map(productsRows.map((p: any) => [String(p.id), p]));

    // 2. Busca APENAS os pedidos ativos de MESA (Ajuste o WHERE conforme seu banco)
    const [ordersRows]: any = await pool.query(
      "SELECT * FROM orders WHERE tipoPedido = 'mesa' AND status != 'finalizado' ORDER BY createdAt DESC"
    );

    // 3. Processa e cruza os dados
    const formattedOrders = ordersRows.map((order: any) => {
      const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
      const parsedProducts = typeof order.products === 'string' ? JSON.parse(order.products || '[]') : (order.products || []);
      const printItens: any[] = [];

      // Traduz Montagens
      parsedItems.forEach((item: any) => {
        const sId = String(item.sizeId || item?.size?.id || "");
        const sizeData = sizesMap.get(sId);
        const sizeName = sizeData ? sizeData.name : "Tamanho Custom";
        let itemTotal = sizeData ? Number(sizeData.price) : Number(item?.size?.price || 0);

        const extractIds = (arr: any[]) => (arr || []).map(x => String(typeof x === 'object' ? x.id : x));
        const massas = extractIds(item.pastas).map(id => menuMap.get(id)).filter(Boolean);
        const molhos = extractIds(item.sauces).map(id => menuMap.get(id)).filter(Boolean);
        const temperos = extractIds(item.seasonings).map(id => menuMap.get(id)).filter(Boolean);
        const ingredientes = extractIds(item.ingredients).map(id => menuMap.get(id)).filter(Boolean);
        const extras = extractIds(item.extras).map(id => menuMap.get(id)).filter(Boolean);

        // Regras de adicionais
        if (sizeData) {
          if (!sizeData.strictMaxPastas && massas.length > sizeData.maxPastas) itemTotal += (massas.length - sizeData.maxPastas) * Number(settings.extraPastaPrice || 0);
          if (!sizeData.strictMaxIngredients && ingredientes.length > sizeData.maxIngredients) itemTotal += (ingredientes.length - sizeData.maxIngredients) * Number(settings.extraIngredientPrice || 0);
          if (!sizeData.strictMaxSauces && molhos.length > sizeData.maxSauces) itemTotal += (molhos.length - sizeData.maxSauces) * Number(settings.extraSaucePrice || 0);
        }

        const extrasText: string[] = [];
        extras.forEach((ex: any) => {
          itemTotal += Number(ex.price || 0);
          extrasText.push(`${ex.name} [R$ ${Number(ex.price || 0).toFixed(2)}]`);
        });

        if (item.extraCheese) {
          const cheesePrice = Number(settings.extraCheesePrice || 8.00);
          itemTotal += cheesePrice;
          extrasText.push(`Queijo Extra [R$ ${cheesePrice.toFixed(2)}]`);
        }

        let descricao = `Montagem: ${sizeName}`;
        if (massas.length) descricao += `   - Massas: ${massas.map(m => m.name).join(', ')}`;
        if (molhos.length) descricao += `   - Molhos:\n${molhos.map(m => m.name).join(', ')}`;
        if (ingredientes.length) descricao += `   -\nIngred: ${ingredientes.map(m => m.name).join(', ')}`;
        if (temperos.length) descricao += `   -\nTemp: ${temperos.map(m => m.name).join(', ')}`;
        if (extrasText.length) descricao += `\n- Extras: ${extrasText.join(', ')}`;

        printItens.push({ quantidade: Number(item.quantity || item.qty || 1), nome: descricao, preco: itemTotal });
      });

      // Traduz Produtos
      parsedProducts.forEach((prod: any) => {
        const pId = String(prod.productId || prod.id || "");
        const dbProd = productsMap.get(pId);
        printItens.push({
          quantidade: Number(prod.quantity || prod.qty || 1),
          nome: dbProd ? dbProd.name : (prod.name || "Produto Avulso"),
          preco: dbProd ? Number(dbProd.price) : Number(prod.price || 0)
        });
      });

      return { ...order, itens: printItens }; // Envia a array mastigada
    });

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar pedidos das mesas" }, { status: 500 });
  }
}