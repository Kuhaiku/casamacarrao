"use client";

import React, { useMemo } from "react";

// Tipagem para os dicionários que o front-end vai usar para cruzar os dados
export type OrderDictionaries = {
  sizes: any[];
  menuItems: any[];
  products: any[];
  settings: any;
};

function formatCurrencyCupom(value: number) {
  return `[R$ ${Number(value || 0).toFixed(2)}]`;
}

function formatCurrencyBRL(value: number) {
  return (value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Função pesada de cruzamento de dados rodando 100% no Front-End
 */
export function processOrderItems(order: any, dictionaries?: OrderDictionaries) {
  if (!order) return [];

  // Se o pedido já vier mastigado (por algum outro fluxo), usa ele.
  if (Array.isArray(order.itens) && order.itens.length > 0) {
    return order.itens;
  }

  const printItens: any[] = [];

  // Se não passou os dicionários, retorna array vazio para evitar quebra
  if (!dictionaries) return printItens;

  const { sizes, menuItems, products, settings } = dictionaries;

  // Criação dos mapas de busca rápida (Lookup Tables)
  const sizesMap = new Map(sizes?.map((s) => [String(s.id), s]) || []);
  const menuMap = new Map(menuItems?.map((m) => [String(m.id), m]) || []);
  const productsMap = new Map(products?.map((p) => [String(p.id), p]) || []);
  const storeSettings = settings || {};

  // 1. Cruzamento das Montagens (Massas Customizadas)
  const rawItems = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);

  rawItems.forEach((item: any) => {
    // Busca do Tamanho
    const sId = String(item.sizeId || item?.size?.id || "");
    const sizeData = sizesMap.get(sId);
    const sizeName = sizeData ? sizeData.name : (item?.size?.name || "Tamanho Custom");
    let itemTotal = sizeData ? Number(sizeData.price || 0) : Number(item?.size?.price || 0);

    // Helpers para buscar nomes/preços no menuMap
    const extractIds = (arr: any[]) => (arr || []).map(x => String(typeof x === 'object' ? (x.id || x.productId) : x));
    
    const massas = extractIds(item.pastas).map(id => menuMap.get(id)).filter(Boolean);
    const molhos = extractIds(item.sauces).map(id => menuMap.get(id)).filter(Boolean);
    const temperos = extractIds(item.seasonings).map(id => menuMap.get(id)).filter(Boolean);
    const ingredientes = extractIds(item.ingredients).map(id => menuMap.get(id)).filter(Boolean);
    const extras = extractIds(item.extras).map(id => menuMap.get(id)).filter(Boolean);

    // Cálculo das Regras de Negócio (Limites e Extras)
    if (sizeData) {
      if (!sizeData.strictMaxPastas && massas.length > sizeData.maxPastas) {
        itemTotal += (massas.length - sizeData.maxPastas) * Number(storeSettings.extraPastaPrice || 0);
      }
      if (!sizeData.strictMaxIngredients && ingredientes.length > sizeData.maxIngredients) {
        itemTotal += (ingredientes.length - sizeData.maxIngredients) * Number(storeSettings.extraIngredientPrice || 0);
      }
      if (!sizeData.strictMaxSauces && molhos.length > sizeData.maxSauces) {
        itemTotal += (molhos.length - sizeData.maxSauces) * Number(storeSettings.extraSaucePrice || 0);
      }
    }

    const extrasText: string[] = [];
    
    // Soma Extras Fixos
    extras.forEach((ex: any) => {
      const extraPrice = Number(ex.price || 0);
      itemTotal += extraPrice;
      extrasText.push(`${ex.name} [R$ ${extraPrice.toFixed(2)}]`);
    });

    // Soma Queijo Extra Dinâmico
    if (item.extraCheese) {
      const cheesePrice = Number(storeSettings.extraCheesePrice || 8.00);
      itemTotal += cheesePrice;
      extrasText.push(`Queijo Extra [R$ ${cheesePrice.toFixed(2)}]`);
    }

    // Formatação Visual (Layout do Cupom da API)
    let descricao = `Montagem: ${sizeName}`;
    if (massas.length) descricao += `   - Massas: ${massas.map(m => m.name).join(', ')}`;
    if (molhos.length) descricao += `   - Molhos:\n${molhos.map(m => m.name).join(', ')}`;
    if (ingredientes.length) descricao += `   -\nIngred: ${ingredientes.map(m => m.name).join(', ')}`;
    if (temperos.length) descricao += `   -\nTemp: ${temperos.map(m => m.name).join(', ')}`;
    if (extrasText.length) descricao += `\n- Extras: ${extrasText.join(', ')}`;

    printItens.push({
      quantidade: Number(item.quantity || item.qty || 1),
      nome: descricao,
      preco: itemTotal
    });
  });

  // 2. Cruzamento dos Produtos Fechados
  const rawProducts = typeof order.products === 'string' ? JSON.parse(order.products || '[]') : (order.products || []);

  rawProducts.forEach((prod: any) => {
    const pId = String(prod.productId || prod.id || "");
    const dbProd = productsMap.get(pId);

    printItens.push({
      quantidade: Number(prod.quantity || prod.qty || 1),
      nome: dbProd ? dbProd.name : (prod.name || "Produto Avulso"),
      preco: dbProd ? Number(dbProd.price) : Number(prod.price || 0)
    });
  });

  return printItens;
}

// ========================================================
// VISUALIZAÇÃO DE TELA (DASHBOARD)
// ========================================================
export function OrderDetailsView({
  order,
  dictionaries,
  compact = false,
}: {
  order: any;
  dictionaries?: OrderDictionaries;
  compact?: boolean;
}) {
  // Executa o cruzamento pesado apenas quando order ou dictionaries mudarem
  const items = useMemo(() => processOrderItems(order, dictionaries), [order, dictionaries]);

  if (!items.length) {
    return (
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
        Aguardando cruzamento de dados do pedido... Certifique-se de passar o prop 'dictionaries'.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item: any, index: number) => {
        const totalLine = item.preco * item.quantidade;
        const lines = String(item.nome || "").split("\n");
        const mainTitle = lines[0];
        const subLines = lines.slice(1);

        return (
          <div
            key={index}
            className={`rounded-2xl border border-stone-200 bg-white ${
              compact ? "p-3" : "p-4"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-stone-800 break-words">
                  {item.quantidade}x {mainTitle}
                </h4>

                {subLines.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {subLines.map((line, i) => (
                      <div key={i} className="text-sm text-stone-600 whitespace-pre-wrap">
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs text-stone-500">{formatCurrencyBRL(item.preco)} un.</p>
                <p className="font-black text-stone-900">{formatCurrencyBRL(totalLine)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ========================================================
// IMPRESSÃO (BOBINA TÉRMICA) - BLINDADO COMO SOLICITADO
// ========================================================
export function PrintableOrderDetails({ order, dictionaries }: { order: any; dictionaries?: OrderDictionaries }) {
  const items = processOrderItems(order, dictionaries);
  const idCurto = order.idCurto || String(order.id || "").split('-')[0].toUpperCase();
  const statusPagamento = (order.isPaid === 1 || order.isPaid === true) ? "PAGO" : "A COBRAR";

  if (!items.length) {
    return <div style={{ fontSize: "12px" }}>Aguardando tradução dos itens...</div>;
  }

  return (
    <div 
      className="receipt-container"
      style={{ 
        width: "300px", 
        fontFamily: "'Courier New', Courier, monospace", 
        fontSize: "13px", 
        lineHeight: "1.2",
        color: "#000",
        padding: "10px",
        backgroundColor: "#fff"
      }}
    >
      <div style={{ textAlign: "center" }}>
        ==============================<br />
        <strong>CASA DO MACARRAO</strong><br />
        ==============================
      </div>
      
      <div style={{ marginTop: "10px" }}>
        <strong>PEDIDO: #{idCurto}</strong><br />
        <strong>CLIENTE: {order.cliente || order.customerName || "Não informado"}</strong>
      </div>

      <div style={{ margin: "10px 0" }}>
        ------------------------------
      </div>

      {items.map((item: any, index: number) => (
        <div key={index} style={{ marginBottom: "15px", whiteSpace: "pre-wrap" }}>
          {item.quantidade}x {item.nome} {formatCurrencyCupom(item.preco * item.quantidade)}
        </div>
      ))}

      <div style={{ margin: "10px 0" }}>
        ------------------------------
      </div>

      <div>
        <strong>TOTAL: {formatCurrencyBRL(Number(order.total || 0))}</strong>
      </div>

      <div style={{ margin: "10px 0" }}>
        ------------------------------
      </div>

      <div style={{ textTransform: "uppercase" }}>
        PAGAMENTO: {order.metodoPagamento || "Não informado"}<br />
        STATUS: {statusPagamento}
      </div>

      <div style={{ textAlign: "center", marginTop: "10px" }}>
        ==============================
      </div>
    </div>
  );
}