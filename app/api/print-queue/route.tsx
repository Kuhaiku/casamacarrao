import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    // 1. Busca os pedidos pendentes
    const [ordersRows]: any = await pool.query(
      "SELECT * FROM orders WHERE status = 'aprovado' AND impresso = false ORDER BY createdAt ASC"
    );

    if (!ordersRows || ordersRows.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Busca os dicionários do banco para traduzir os IDs
    const [sizesRows]: any = await pool.query("SELECT id, name FROM sizes");
    const [menuItemsRows]: any = await pool.query("SELECT id, name FROM menu_items");
    const [productsRows]: any = await pool.query("SELECT id, name FROM products");

    // 3. Monta mapas (Maps) para busca ultra-rápida na memória
    const sizesMap = new Map(sizesRows.map((s: any) => [s.id, s.name]));
    const menuMap = new Map(menuItemsRows.map((m: any) => [m.id, m.name]));
    const productsMap = new Map(productsRows.map((p: any) => [p.id, p.name]));

    // 4. Formata o pedido traduzindo tudo
    const formattedOrders = ordersRows.map((order: any) => {
      const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      const parsedProducts = typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []);

      const printItens: any[] = [];

      // Traduz os "Montar Macarrão" (Custom Pastas)
      parsedItems.forEach((item: any) => {
        const sizeName = sizesMap.get(item.sizeId) || "Tamanho Custom";
        
        const massas = (item.pastas || []).map((id: string) => menuMap.get(id)).filter(Boolean);
        const molhos = (item.sauces || []).map((id: string) => menuMap.get(id)).filter(Boolean);
        const temperos = (item.seasonings || []).map((id: string) => menuMap.get(id)).filter(Boolean);
        const ingredientes = (item.ingredients || []).map((id: string) => menuMap.get(id)).filter(Boolean);
        const extras = (item.extras || []).map((id: string) => menuMap.get(id)).filter(Boolean);

        // Monta o texto multilinha do cupom para ficar bem organizado
        let descricao = `Montagem: ${sizeName}`;
        if (massas.length) descricao += `\n  - Massas: ${massas.join(', ')}`;
        if (molhos.length) descricao += `\n  - Molhos: ${molhos.join(', ')}`;
        if (temperos.length) descricao += `\n  - Temp: ${temperos.join(', ')}`;
        if (ingredientes.length) descricao += `\n  - Ingred: ${ingredientes.join(', ')}`;
        if (extras.length) descricao += `\n  - Extras: ${extras.join(', ')}`;
        if (item.extraCheese) descricao += `\n  - ** COM QUEIJO EXTRA **`;

        printItens.push({
          quantidade: 1,
          nome: descricao,
          preco: Number(item.preco || 0)
        });
      });

      // Traduz os Produtos Fechados (Refrigerantes, Sobremesas, etc)
      parsedProducts.forEach((prod: any) => {
        const pName = productsMap.get(prod.productId) || "Produto Avulso";
        printItens.push({
          quantidade: prod.quantity || 1,
          nome: pName,
          preco: Number(prod.price || 0)
        });
      });

    return {
        id: order.id,
        idCurto: String(order.id).split('-')[0].toUpperCase(),
        tipoPedido: order.tipoPedido || "delivery",
        cliente: order.customerName || "Cliente Padrão",
        telefone: order.phone || "Sem Telefone",
        endereco: order.address || "Retirada no Balcão",
        observacao: order.observation || "",
        total: Number(order.total || 0),
        itens: printItens,
        metodoPagamento: order.paymentMethod || "Não informado", // NOVO
        isPaid: order.isPaid === 1 || order.isPaid === true,     // NOVO
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Erro ao traduzir fila:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}