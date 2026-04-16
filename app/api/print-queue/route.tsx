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

    // 2. Busca os dicionários e preços atuais do banco
    const [sizesRows]: any = await pool.query("SELECT * FROM sizes");
    const [menuItemsRows]: any = await pool.query("SELECT id, name, price FROM menu_items");
    const [productsRows]: any = await pool.query("SELECT id, name, price FROM products");
    const [settingsRows]: any = await pool.query("SELECT extraPastaPrice, extraIngredientPrice, extraSaucePrice FROM store_settings WHERE id = 1");
    
    const settings: any = settingsRows[0] || {};

    // 3. Monta mapas na memória contendo o NOME e o PREÇO (Com tipagem explícita)
    const sizesMap = new Map<string, any>(sizesRows.map((s: any) => [s.id, s]));
    const menuMap = new Map<string, any>(menuItemsRows.map((m: any) => [m.id, { name: m.name, price: Number(m.price || 0) }]));
    const productsMap = new Map<string, any>(productsRows.map((p: any) => [p.id, { name: p.name, price: Number(p.price || 0) }]));

    // 4. Formata o pedido traduzindo e CALCULANDO os preços
    const formattedOrders = ordersRows.map((order: any) => {
      const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      const parsedProducts = typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []);

      const printItens: any[] = [];

      // A. Traduz as Montagens (Custom Pastas)
      parsedItems.forEach((item: any) => {
        const sizeData: any = sizesMap.get(item.sizeId); // <--- Tipagem forçada para evitar erro 2339
        const sizeName = sizeData ? sizeData.name : "Tamanho Custom";
        
        // Inicia com o preço base da embalagem/tamanho
        let itemTotal = sizeData ? Number(sizeData.price || 0) : 0;

        const massas = (item.pastas || []).map((id: string) => menuMap.get(id)).filter(Boolean);
        const molhos = (item.sauces || []).map((id: string) => menuMap.get(id)).filter(Boolean);
        const temperos = (item.seasonings || []).map((id: string) => menuMap.get(id)).filter(Boolean);
        const ingredientes = (item.ingredients || []).map((id: string) => menuMap.get(id)).filter(Boolean);
        const extras = (item.extras || []).map((id: string) => menuMap.get(id)).filter(Boolean);

        // Calcula os adicionais que ultrapassam o limite grátis
        if (sizeData) {
            const qtdPastas = (item.pastas || []).length;
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

        // Soma o preço dos "Extras" fixos selecionados
        extras.forEach((extra: any) => {
            itemTotal += extra.price;
        });

        // Adicional do Queijo Extra
        if (item.extraCheese) {
            itemTotal += 3.0; // Valor fixo. Se no futuro vier do DB, altere aqui.
        }

        // Monta o texto visual
        let descricao = `Montagem: ${sizeName}`;
        if (massas.length) descricao += `\n  - Massas: ${massas.map((m: any) => m.name).join(', ')}`;
        if (molhos.length) descricao += `\n  - Molhos: ${molhos.map((m: any) => m.name).join(', ')}`;
        if (temperos.length) descricao += `\n  - Temp: ${temperos.map((m: any) => m.name).join(', ')}`;
        if (ingredientes.length) descricao += `\n  - Ingred: ${ingredientes.map((m: any) => m.name).join(', ')}`;
        if (extras.length) descricao += `\n  - Extras: ${extras.map((m: any) => m.name).join(', ')}`;
        if (item.extraCheese) descricao += `\n  - ** COM QUEIJO EXTRA **`;

        printItens.push({
          quantidade: 1,
          nome: descricao,
          preco: itemTotal // Valor real calculado preenchido
        });
      });

      // B. Traduz os Produtos Fechados (Ex: Coca-Cola)
      parsedProducts.forEach((prod: any) => {
        const productData: any = productsMap.get(prod.productId); // <--- Tipagem forçada
        const pName = productData ? productData.name : "Produto Avulso";
        const pPrice = productData ? productData.price : 0;
        
        printItens.push({
          quantidade: prod.quantity || 1,
          nome: pName,
          preco: pPrice // Valor base do produto preenchido
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
        metodoPagamento: order.paymentMethod || "Não informado",
        isPaid: order.isPaid === 1 || order.isPaid === true
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Erro ao traduzir fila:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}