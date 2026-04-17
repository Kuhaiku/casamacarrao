"use client";

type GenericItem = any;

function normalizeList(value: any): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((v) => {
        if (typeof v === "string") return [v];
        if (typeof v === "object" && v) {
          return [
            v.name,
            v.nome,
            v.label,
            v.value,
            v.title,
            v.description,
          ].filter(Boolean);
        }
        return [];
      })
      .filter(Boolean)
      .map(String);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function getItemTitle(item: GenericItem) {
  return (
    item?.name ||
    item?.nome ||
    item?.productName ||
    item?.title ||
    item?.produto?.name ||
    item?.produto?.nome ||
    "Item sem nome"
  );
}

function getQty(item: GenericItem) {
  return Number(item?.quantity ?? item?.qty ?? item?.amount ?? 1);
}

function getPrice(item: GenericItem) {
  return Number(item?.price ?? item?.unitPrice ?? item?.valor ?? 0);
}

function getTotal(item: GenericItem) {
  const explicitTotal = Number(item?.total ?? item?.subtotal ?? NaN);
  if (!Number.isNaN(explicitTotal)) return explicitTotal;
  return getQty(item) * getPrice(item);
}

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getField(item: GenericItem, keys: string[]) {
  for (const key of keys) {
    if (item?.[key] != null) return item[key];
  }
  return undefined;
}

function buildSections(item: GenericItem) {
  const massa = getField(item, ["massa", "mass", "massaName"]);
  const molhos = normalizeList(
    getField(item, ["molhos", "sauces", "molho", "sauce"]),
  );
  const temperos = normalizeList(
    getField(item, ["temperos", "seasonings", "tempero", "seasoning"]),
  );
  const ingredientes = normalizeList(
    getField(item, [
      "ingredientes",
      "ingredients",
      "adicionais",
      "addons",
      "complementos",
      "extras",
    ]),
  );
  const extrasPagos = normalizeList(
    getField(item, [
      "extrasPagos",
      "paidExtras",
      "extraPaid",
      "extra_payments",
    ]),
  );
  const observacoes = normalizeList(
    getField(item, ["observation", "observacao", "obs", "notes", "note"]),
  );
  const outrosItens = normalizeList(
    getField(item, ["outrosItens", "otherItems", "itensExtras"]),
  );

  const sections: { label: string; value: string[] | string }[] = [];

  if (massa) sections.push({ label: "Massa", value: String(massa) });
  if (molhos.length) sections.push({ label: "Molhos", value: molhos });
  if (temperos.length) sections.push({ label: "Temperos", value: temperos });
  if (ingredientes.length)
    sections.push({ label: "Ingredientes", value: ingredientes });
  if (extrasPagos.length)
    sections.push({ label: "Extras Pagos", value: extrasPagos });
  if (outrosItens.length)
    sections.push({ label: "Outros Itens", value: outrosItens });
  if (observacoes.length)
    sections.push({ label: "Observações", value: observacoes });

  return sections;
}

export function getOrderItems(order: any) {
  if (!order) return [];
  if (Array.isArray(order.items)) return order.items;
  if (Array.isArray(order.cart)) return order.cart;
  if (Array.isArray(order.products)) return order.products;
  if (Array.isArray(order.orderItems)) return order.orderItems;
  return [];
}

export function OrderDetailsView({
  order,
  compact = false,
}: {
  order: any;
  compact?: boolean;
}) {
  const items = getOrderItems(order);

  if (!items.length) {
    return (
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
        Nenhum item detalhado encontrado no pedido.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item: GenericItem, index: number) => {
        const qty = getQty(item);
        const price = getPrice(item);
        const total = getTotal(item);
        const title = getItemTitle(item);
        const sections = buildSections(item);

        return (
          <div
            key={item?.id ?? `${title}-${index}`}
            className={`rounded-2xl border border-stone-200 bg-white ${
              compact ? "p-3" : "p-4"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-stone-800 break-words">
                  {qty}x {title}
                </h4>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs text-stone-500">{formatCurrency(price)} un.</p>
                <p className="font-black text-stone-900">{formatCurrency(total)}</p>
              </div>
            </div>

            {sections.length > 0 && (
              <div className="mt-3 space-y-2 border-l-2 border-stone-200 pl-3">
                {sections.map((section) => (
                  <div key={section.label}>
                    <span className="font-bold text-stone-700">
                      {section.label}:{" "}
                    </span>

                    {Array.isArray(section.value) ? (
                      <span className="text-stone-700 break-words">
                        {section.value.join(", ")}
                      </span>
                    ) : (
                      <span className="text-stone-700 break-words">
                        {section.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PrintableOrderDetails({ order }: { order: any }) {
  const items = getOrderItems(order);

  if (!items.length) {
    return <div>Nenhum item detalhado encontrado.</div>;
  }

  return (
    <div className="receipt-items">
      {items.map((item: GenericItem, index: number) => {
        const qty = getQty(item);
        const total = getTotal(item);
        const title = getItemTitle(item);
        const sections = buildSections(item);

        return (
          <div
            key={item?.id ?? `${title}-${index}`}
            className="receipt-item"
            style={{
              marginBottom: "8px",
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1, minWidth: 0, whiteSpace: "normal" }}>
                <strong>
                  {qty}x {title}
                </strong>
              </div>
              <div style={{ whiteSpace: "nowrap" }}>{formatCurrency(total)}</div>
            </div>

            {sections.length > 0 && (
              <div style={{ marginTop: "4px", paddingLeft: "8px" }}>
                {sections.map((section) => (
                  <div
                    key={section.label}
                    style={{
                      fontSize: "11px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    <strong>{section.label}:</strong>{" "}
                    {Array.isArray(section.value)
                      ? section.value.join(", ")
                      : section.value}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}