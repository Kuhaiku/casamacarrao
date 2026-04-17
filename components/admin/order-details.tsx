"use client";

import React, { useMemo } from "react";
import { useStore } from "@/lib/store";
import type { PrintConfig } from "./print-settings-modal";
import { DEFAULT_PRINT_CONFIG } from "./print-settings-modal";

function formatCurrencyCupom(value: number) {
  return `[R$ ${Number(value || 0).toFixed(2)}]`;
}

function formatCurrencyBRL(value: number) {
  return (value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function wrapText(text: string, maxWidth: number): string[] {
  const normalized = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const paragraphs = normalized.split("\n");
  const lines: string[] = [];

  paragraphs.forEach((paragraph) => {
    const trimmedParagraph = paragraph.trim();

    if (!trimmedParagraph) {
      lines.push("");
      return;
    }

    const words = trimmedParagraph.split(/\s+/);
    let currentLine = "";

    words.forEach((word) => {
      if (!word) return;

      if (word.length > maxWidth) {
        if (currentLine.trim()) {
          lines.push(currentLine.trimEnd());
          currentLine = "";
        }

        for (let i = 0; i < word.length; i += maxWidth) {
          lines.push(word.slice(i, i + maxWidth));
        }
        return;
      }

      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine.trim()) {
          lines.push(currentLine.trimEnd());
        }
        currentLine = word;
      }
    });

    if (currentLine.trim()) {
      lines.push(currentLine.trimEnd());
    }
  });

  return lines.length ? lines : [""];
}

function processOrderItems(order: any, storeData: any) {
  if (!order) return [];
  const printItens: any[] = [];

  const { sizes = [], menuItems = [], products = [], settings = {} } = storeData;

  const sizesMap = new Map<string, any>(sizes.map((s: any) => [String(s.id), s]));
  const menuMap = new Map<string, any>(menuItems.map((m: any) => [String(m.id), m]));
  const productsMap = new Map<string, any>(products.map((p: any) => [String(p.id), p]));

  const rawItems =
    typeof order.items === "string"
      ? JSON.parse(order.items || "[]")
      : order.items || [];

  rawItems.forEach((item: any) => {
    const sId = String(item.sizeId || "");
    const sizeData: any = sizesMap.get(sId);
    const sizeName = sizeData ? sizeData.name : "Tamanho Indefinido";

    let itemTotal = sizeData ? Number(sizeData.price || 0) : 0;

    const getItem = (id: string): any => menuMap.get(String(id));

    const massa: any = item.pastaId ? getItem(item.pastaId) : null;
    const molhos: any[] = (item.sauces || []).map(getItem).filter(Boolean);
    const temperos: any[] = (item.temperos || item.seasonings || [])
      .map(getItem)
      .filter(Boolean);
    const ingredientes: any[] = (item.ingredients || []).map(getItem).filter(Boolean);
    const extras: any[] = (item.extras || []).map(getItem).filter(Boolean);

    if (sizeData) {
      if (
        !sizeData.strictMaxIngredients &&
        ingredientes.length > sizeData.maxIngredients
      ) {
        itemTotal +=
          (ingredientes.length - sizeData.maxIngredients) *
          Number(settings.extraIngredientPrice || 0);
      }

      if (!sizeData.strictMaxSauces && molhos.length > sizeData.maxSauces) {
        itemTotal +=
          (molhos.length - sizeData.maxSauces) *
          Number(settings.extraSaucePrice || 0);
      }
    }

    const extrasText: string[] = [];
    extras.forEach((ex: any) => {
      const extraPrice = Number(ex.price || 0);
      itemTotal += extraPrice;
      extrasText.push(`${ex.name} [R$ ${extraPrice.toFixed(2)}]`);
    });

    if (item.extraCheese) {
      const cheesePrice = Number(settings.extraCheesePrice || 8.0);
      itemTotal += cheesePrice;
      extrasText.push(`Queijo Extra [R$ ${cheesePrice.toFixed(2)}]`);
    }

    let descricao = `Montagem: ${sizeName}`;
    if (massa) descricao += `\n- Massa: ${massa.name}`;
    if (molhos.length) descricao += `\n- Molhos: ${molhos.map((m: any) => m.name).join(", ")}`;
    if (ingredientes.length) descricao += `\n- Ingred: ${ingredientes.map((m: any) => m.name).join(", ")}`;
    if (temperos.length) descricao += `\n- Temp: ${temperos.map((m: any) => m.name).join(", ")}`;
    if (extrasText.length) descricao += `\n- Extras: ${extrasText.join(", ")}`;

    printItens.push({
      quantidade: Number(item.quantity || 1),
      nome: descricao,
      preco: itemTotal,
    });
  });

  const rawProducts =
    typeof order.products === "string"
      ? JSON.parse(order.products || "[]")
      : order.products || [];

  rawProducts.forEach((prod: any) => {
    const pId = String(prod.productId || "");
    const dbProd: any = productsMap.get(pId);

    printItens.push({
      quantidade: Number(prod.quantity || 1),
      nome: dbProd ? dbProd.name : "Produto Avulso",
      preco: dbProd ? Number(dbProd.price) : 0,
    });
  });

  return printItens;
}

function getCharsPerLine(config?: Partial<PrintConfig>) {
  const width = config?.paperWidth ?? DEFAULT_PRINT_CONFIG.paperWidth;
  return width === "80mm" ? 48 : 30;
}

function getPaperPixelWidth(config?: Partial<PrintConfig>) {
  const width = config?.paperWidth ?? DEFAULT_PRINT_CONFIG.paperWidth;
  return width === "80mm" ? 302 : 220;
}

function getMergedConfig(config?: Partial<PrintConfig>): PrintConfig {
  return {
    ...DEFAULT_PRINT_CONFIG,
    ...config,
  };
}

function normalizePaymentMethod(order: any) {
  return (
    order?.paymentMethodLabel ||
    order?.paymentMethod ||
    order?.payment ||
    "Não informado"
  );
}

function normalizeCustomerName(order: any) {
  return (
    order?.customerName ||
    order?.name ||
    order?.customer?.name ||
    "Cliente não informado"
  );
}

function normalizeGeneralObservation(order: any) {
  return (
    order?.generalObservation ||
    order?.observation ||
    order?.notes ||
    order?.customerNote ||
    ""
  );
}

function normalizeServiceFee(order: any) {
  return Number(
    order?.serviceFee ??
      order?.service_fee ??
      order?.tenPercentFee ??
      order?.fee ??
      0
  );
}

function calculateItemsTotal(items: any[]) {
  return items.reduce((acc, item) => acc + Number(item.preco || 0) * Number(item.quantidade || 0), 0);
}

export function OrderDetailsView({
  order,
  compact = false,
}: {
  order: any;
  compact?: boolean;
}) {
  const storeData = useStore();
  const items = useMemo(() => processOrderItems(order, storeData), [order, storeData]);

  if (!items.length) {
    return (
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
        Nenhum detalhe encontrado para o pedido.
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
                      <div
                        key={i}
                        className="text-sm text-stone-600 whitespace-pre-wrap"
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs text-stone-500">
                  {formatCurrencyBRL(item.preco)} un.
                </p>
                <p className="font-black text-stone-900">
                  {formatCurrencyBRL(totalLine)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PrintableOrderDetails({
  order,
  config,
}: {
  order: any;
  config?: Partial<PrintConfig>;
}) {
  const storeData = useStore();
  const items = processOrderItems(order, storeData);
  const mergedConfig = getMergedConfig(config);
  const charsPerLine = getCharsPerLine(mergedConfig);

  if (!items.length) {
    return <div style={{ textAlign: "left" }}>Nenhum item formatado.</div>;
  }

  return (
    <div
      className="receipt-items"
      style={{
        width: "100%",
        textAlign: "left",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: `${mergedConfig.fontSize}px`,
        lineHeight: "1.25",
      }}
    >
      {items.map((item: any, index: number) => {
        const itemText = `${item.quantidade}x ${String(item.nome || "").replace(/\n/g, " ")}`;
        const wrappedItemLines = wrapText(itemText, charsPerLine);
        const totalText = formatCurrencyCupom(item.preco * item.quantidade);

        return (
          <div
            key={index}
            style={{
              marginBottom: "12px",
              display: "block",
              width: "100%",
            }}
          >
            <div style={{ display: "block", textAlign: "left" }}>
              {wrappedItemLines.map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  style={{
                    display: "block",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  {lineIndex === 0 ? <strong>{line}</strong> : line}
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "3px",
                fontWeight: "bold",
                textAlign: "left",
                display: "block",
              }}
            >
              {totalText}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PrintableOrderDocument({
  order,
  config,
  title = "DETALHES DO PEDIDO",
}: {
  order: any;
  config?: Partial<PrintConfig>;
  title?: string;
}) {
  const storeData = useStore();
  const mergedConfig = getMergedConfig(config);
  const items = processOrderItems(order, storeData);

  const customerName = normalizeCustomerName(order);
  const paymentMethod = normalizePaymentMethod(order);
  const observation = normalizeGeneralObservation(order);
  const serviceFee = normalizeServiceFee(order);
  const itemsTotal = calculateItemsTotal(items);
  const total =
    Number(order?.total ?? order?.finalTotal ?? itemsTotal + serviceFee) || 0;

  return (
    <div
      className="print-document"
      style={{
        width: `${getPaperPixelWidth(mergedConfig)}px`,
        maxWidth: "100%",
        margin: "0 auto",
        background: "#fff",
        color: "#000",
        boxSizing: "border-box",
        paddingTop: `${mergedConfig.marginTop}mm`,
        paddingRight: `${mergedConfig.marginRight}mm`,
        paddingBottom: `${mergedConfig.marginBottom}mm`,
        paddingLeft: `${mergedConfig.marginLeft}mm`,
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: `${mergedConfig.fontSize}px`,
        lineHeight: "1.3",
      }}
    >
      <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "8px" }}>
        {title}
      </div>

      <div
        style={{
          borderTop: "1px dashed #000",
          margin: "6px 0",
        }}
      />

      {mergedConfig.showCustomer && (
        <div style={{ marginBottom: "6px" }}>
          <strong>Cliente:</strong> {customerName}
        </div>
      )}

      {mergedConfig.showPaymentMethod && (
        <div style={{ marginBottom: "6px" }}>
          <strong>Pagamento:</strong> {paymentMethod}
        </div>
      )}

      {mergedConfig.showGeneralObservation && observation && (
        <div style={{ marginBottom: "8px" }}>
          <strong>Obs.:</strong> {observation}
        </div>
      )}

      <div
        style={{
          borderTop: "1px dashed #000",
          margin: "6px 0 10px",
        }}
      />

      <PrintableOrderDetails order={order} config={mergedConfig} />

      <div
        style={{
          borderTop: "1px dashed #000",
          margin: "10px 0 8px",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span>Subtotal</span>
        <strong>{formatCurrencyBRL(itemsTotal)}</strong>
      </div>

      {mergedConfig.showServiceFee && serviceFee > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Serviço</span>
          <strong>{formatCurrencyBRL(serviceFee)}</strong>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
        <span>Total</span>
        <strong>{formatCurrencyBRL(total)}</strong>
      </div>
    </div>
  );
}