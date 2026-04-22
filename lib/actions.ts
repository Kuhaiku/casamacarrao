"use server";

import { pool } from "./db";
import { randomUUID } from "crypto";

const mapBooleans = (obj: any) => {
  const newObj = { ...obj };
  for (const key in newObj) {
    if (
      typeof newObj[key] === "number" &&
      (newObj[key] === 1 || newObj[key] === 0)
    ) {
      if (
        [
          "strictMaxPastas",
          "strictMaxIngredients",
          "strictMaxSauces",
          "isActive",
          "isPaid",
          "isAccounted",
          "isOpen",
          "mercadoPagoAtivo",
          "tem_embalagem",
          "autoApprove",
          "autoApproveMesa",
          "ativo",
          "acceptCard",
        ].includes(key)
      ) {
        newObj[key] = newObj[key] === 1;
      }
    }
  }
  return newObj;
};

export async function verifyFinanceiroPassword(password: string) {
  return password === process.env.FINANCEIRO_PASSWORD;
}

export async function verifyAdminPassword(password: string) {
  return password === process.env.ADMIN_PASSWORD;
}

export async function verifyMotoboyPassword(password: string) {
  return password === process.env.MOTOBOY_PASSWORD;
}

export async function getStoreData() {
  try {
    const [sizes] = await pool.query("SELECT * FROM sizes");
    const [menuItems] = await pool.query("SELECT * FROM menu_items");
    const [productCategories] = await pool.query(
      "SELECT * FROM product_categories ORDER BY orderIndex ASC, id ASC",
    );
    const [products] = await pool.query("SELECT * FROM products");
    const [bairros] = await pool.query(
      "SELECT * FROM bairros_atendidos ORDER BY nome ASC",
    );
    const [settingsResult]: any = await pool.query(
      "SELECT * FROM store_settings WHERE id = 1",
    );

    const [orders] = await pool.query(
      "SELECT * FROM orders ORDER BY createdAt DESC LIMIT 1500",
    );
    const [expenses] = await pool.query(
      "SELECT * FROM financial_entries WHERE type = 'expense' ORDER BY id DESC LIMIT 500",
    );
    const [tips] = await pool.query(
      "SELECT * FROM financial_entries WHERE type = 'tip' ORDER BY id DESC LIMIT 500",
    );
    const [registers] = await pool.query(
      "SELECT * FROM cash_registers ORDER BY closedAt DESC LIMIT 30",
    );

    const settings = settingsResult[0] || {};

    // ENRAIZANDO A SEGUNDA-FEIRA (Dia 1 = Segunda)
    let parsedSchedule = settings.deliverySchedule
      ? JSON.parse(settings.deliverySchedule)
      : null;
    if (parsedSchedule && parsedSchedule["1"]) {
      parsedSchedule["1"].active = false; // Força sempre a ser falso
    }

    return {
      sizes: (sizes as any[])
        .map(mapBooleans)
        .map((s) => ({ ...s, price: Number(s.price) })),
      menuItems: (menuItems as any[])
        .map(mapBooleans)
        .map((m) => ({ ...m, price: Number(m.price || 0) })),
      productCategories: (productCategories as any[]).map(mapBooleans),
      products: (products as any[])
        .map(mapBooleans)
        .map((p) => ({ ...p, price: Number(p.price) })),
      bairros: (bairros as any[])
        .map(mapBooleans)
        .map((b) => ({ ...b, taxa_entrega: Number(b.taxa_entrega) })),
      settings: {
        ...settings,
        autoApprove:
          settings.autoApprove === 1 || settings.autoApprove === true,
        autoApproveMesa:
          settings.autoApproveMesa === 1 || settings.autoApproveMesa === true,
        isOpen: settings.isOpen === 1 || settings.isOpen === true,
        acceptCard: settings.acceptCard === 1 || settings.acceptCard === true,
        mercadoPagoAtivo:
          settings.mercadoPagoAtivo === 1 || settings.mercadoPagoAtivo === true,
        deliverySchedule: parsedSchedule,
      },
      orders: (orders as any[]).map(mapBooleans).map((o) => ({
        ...o,
        total: Number(o.total),
        subtotal: Number(o.subtotal || 0),
        taxaEntrega: Number(o.taxaEntrega || 0),
        taxaEmbalagem: Number(o.taxaEmbalagem || 0),
        taxaCartao: Number(o.taxaCartao || 0),
        createdAt: new Date(o.createdAt).toISOString(),
        deliveredAt: o.deliveredAt
          ? new Date(o.deliveredAt).toISOString()
          : undefined,
        approvedAt: o.approvedAt
          ? new Date(o.approvedAt).toISOString()
          : undefined,
        items: typeof o.items === "string" ? JSON.parse(o.items) : o.items,
        products: o.products
          ? typeof o.products === "string"
            ? JSON.parse(o.products)
            : o.products
          : [],
      })),
      expenses: (expenses as any[])
        .map(mapBooleans)
        .map((e) => ({ ...e, amount: Number(e.amount) })),
      tips: (tips as any[])
        .map(mapBooleans)
        .map((t) => ({ ...t, amount: Number(t.amount) })),
      cashRegisters: (registers as any[]).map((r) => ({
        ...r,
        netTotal: Number(r.netTotal),
      })),
    };
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    throw error;
  }
}

export async function dbDispatch(action: string, payload: any) {
  switch (action) {
    case "UPDATE_SETTINGS": {
      const validPayload = { ...payload };

      if (validPayload.deliverySchedule) {
        if (validPayload.deliverySchedule["1"]) {
          validPayload.deliverySchedule["1"].active = false;
        }
        validPayload.deliverySchedule = JSON.stringify(
          validPayload.deliverySchedule,
        );
      }

      for (const key in validPayload) {
        if (typeof validPayload[key] === "boolean") {
          validPayload[key] = validPayload[key] ? 1 : 0;
        }
      }

      delete validPayload.bairros;

      if (Object.keys(validPayload).length === 0) break;

      await pool.query("UPDATE store_settings SET ? WHERE id = 1", [
        validPayload,
      ]);
      break;
    }
    case "REORDER_CATEGORIES":
      for (const cat of payload.categories) {
        await pool.query(
          "UPDATE product_categories SET orderIndex = ? WHERE id = ?",
          [cat.orderIndex, cat.id],
        );
      }
      break;
    case "ADD_BAIRRO":
      await pool.query(
        "INSERT INTO bairros_atendidos (nome, cidade, taxa_entrega, ativo) VALUES (?, ?, ?, ?)",
        [
          payload.nome,
          payload.cidade,
          payload.taxa_entrega,
          payload.ativo ? 1 : 0,
        ],
      );
      break;
    case "ADD_MENU_ITEM":
      await pool.query(
        "INSERT INTO menu_items (id, name, category, isActive, price) VALUES (?, ?, ?, ?, ?)",
        [
          payload.id || randomUUID(),
          payload.name,
          payload.category,
          payload.isActive ? 1 : 0,
          payload.price || 0,
        ],
      );
      break;
    case "UPDATE_MENU_ITEM":
      await pool.query("UPDATE menu_items SET ? WHERE id = ?", [
        payload.updates,
        payload.id,
      ]);
      break;
    case "TOGGLE_MENU_ITEM":
      await pool.query(
        "UPDATE menu_items SET isActive = NOT isActive WHERE id = ?",
        [payload.id],
      );
      break;
    case "DELETE_MENU_ITEM":
      await pool.query("DELETE FROM menu_items WHERE id = ?", [payload.id]);
      break;
    case "ADD_SIZE":
      await pool.query(
        "INSERT INTO sizes (id, name, price, maxPastas, strictMaxPastas, maxIngredients, strictMaxIngredients, maxSauces, strictMaxSauces, taxaEmbalagem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          payload.id || randomUUID(),
          payload.name,
          payload.price,
          payload.maxPastas,
          payload.strictMaxPastas ? 1 : 0,
          payload.maxIngredients,
          payload.strictMaxIngredients ? 1 : 0,
          payload.maxSauces,
          payload.strictMaxSauces ? 1 : 0,
          payload.taxaEmbalagem || 0,
        ],
      );
      break;
    case "UPDATE_SIZE": {
      const validSizeUpdates = { ...payload.updates };
      if (typeof validSizeUpdates.strictMaxPastas === "boolean")
        validSizeUpdates.strictMaxPastas = validSizeUpdates.strictMaxPastas
          ? 1
          : 0;
      if (typeof validSizeUpdates.strictMaxIngredients === "boolean")
        validSizeUpdates.strictMaxIngredients =
          validSizeUpdates.strictMaxIngredients ? 1 : 0;
      if (typeof validSizeUpdates.strictMaxSauces === "boolean")
        validSizeUpdates.strictMaxSauces = validSizeUpdates.strictMaxSauces
          ? 1
          : 0;
      await pool.query("UPDATE sizes SET ? WHERE id = ?", [
        validSizeUpdates,
        payload.id,
      ]);
      break;
    }
    case "DELETE_SIZE":
      await pool.query("DELETE FROM sizes WHERE id = ?", [payload.id]);
      break;
    case "ADD_PRODUCT_CATEGORY":
      await pool.query(
        "INSERT INTO product_categories (id, name, isActive) VALUES (?, ?, ?)",
        [payload.id || randomUUID(), payload.name, payload.isActive ? 1 : 0],
      );
      break;
    case "UPDATE_PRODUCT_CATEGORY":
      await pool.query("UPDATE product_categories SET ? WHERE id = ?", [
        payload.updates,
        payload.id,
      ]);
      break;
    case "DELETE_PRODUCT_CATEGORY":
      await pool.query("DELETE FROM product_categories WHERE id = ?", [
        payload.id,
      ]);
      break;
    case "ADD_PRODUCT":
      await pool.query(
        "INSERT INTO products (id, name, price, categoryId, isActive, tipoEmbalagem, taxaEmbalagem) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          payload.id || randomUUID(),
          payload.name,
          payload.price,
          payload.categoryId,
          payload.isActive ? 1 : 0,
          payload.tipoEmbalagem || "nenhuma",
          payload.taxaEmbalagem || 0,
        ],
      );
      break;
    case "UPDATE_PRODUCT":
      await pool.query("UPDATE products SET ? WHERE id = ?", [
        payload.updates,
        payload.id,
      ]);
      break;
    case "TOGGLE_PRODUCT":
      await pool.query(
        "UPDATE products SET isActive = NOT isActive WHERE id = ?",
        [payload.id],
      );
      break;
    case "DELETE_PRODUCT":
      await pool.query("DELETE FROM products WHERE id = ?", [payload.id]);
      break;
    case "UPDATE_BAIRRO":
      await pool.query("UPDATE bairros_atendidos SET ? WHERE id = ?", [
        payload.updates,
        payload.id,
      ]);
      break;
    case "DELETE_BAIRRO":
      await pool.query("DELETE FROM bairros_atendidos WHERE id = ?", [
        payload.id,
      ]);
      break;
    case "TOGGLE_BAIRRO":
      await pool.query(
        "UPDATE bairros_atendidos SET ativo = NOT ativo WHERE id = ?",
        [payload.id],
      );
      break;

    // =========================================
    // CORREÇÃO: COLUNAS ADICIONADAS AO INSERT
    // =========================================
    case "ADD_ORDER": {
      const [settingRows]: any = await pool.query(
        "SELECT * FROM store_settings WHERE id = 1",
      );
      const isMesa =
        payload.tipoPedido === "mesa" ||
        (payload.address && payload.address.toLowerCase().includes("mesa"));

      const isAutoMesa =
        settingRows[0].autoApproveMesa === 1 ||
        settingRows[0].autoApproveMesa === true;
      const isAutoDelivery =
        settingRows[0].autoApprove === 1 || settingRows[0].autoApprove === true;

      let isAuto = isMesa ? isAutoMesa : isAutoDelivery;

      const method = payload.paymentMethod?.toLowerCase() || "";
      if (
        method.includes("cartão") ||
        method.includes("cartao") ||
        method.includes("mercado pago")
      ) {
        isAuto = false;
      }

      const status = isAuto ? "aprovado" : "novo";
      const approvedAt = isAuto ? new Date() : null;

      await pool.query(
        `INSERT INTO orders (
          id, customerName, phone, address, paymentMethod, status, isPaid, 
          subtotal, taxaEmbalagem, taxaEntrega, taxaCartao, total, 
          items, products, observation, approvedAt, tipoPedido
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.id || randomUUID(),
          payload.customerName,
          payload.phone || "0",
          payload.address || "Balcão",
          payload.paymentMethod || "PIX",
          status,
          payload.isPaid ? 1 : 0,
          payload.subtotal || 0,
          payload.taxaEmbalagem || 0,
          payload.taxaEntrega || 0,
          payload.taxaCartao || 0,
          payload.total || 0,
          JSON.stringify(payload.items || []),
          JSON.stringify(payload.products || []),
          payload.observation || "",
          approvedAt,
          payload.tipoPedido || "delivery",
        ],
      );
      break;
    }
    case "CONFIRM_ONLINE_PAYMENT":
      await pool.query(
        "UPDATE orders SET status = 'aprovado', isPaid = 1, approvedAt = ? WHERE id = ? AND isPaid = 0",
        [new Date(), payload.id],
      );
      break;
    case "UPDATE_ORDER_STATUS":
      const updateData: any = { status: payload.status };
      if (payload.status === "aprovado") updateData.approvedAt = new Date();
      if (payload.deliveredAt)
        updateData.deliveredAt = new Date(payload.deliveredAt);
      await pool.query("UPDATE orders SET ? WHERE id = ?", [
        updateData,
        payload.id,
      ]);
      break;
    case "TOGGLE_ORDER_PAID":
      await pool.query("UPDATE orders SET isPaid = NOT isPaid WHERE id = ?", [
        payload.id,
      ]);
      break;
    case "ADD_EXPENSE":
      await pool.query(
        "INSERT INTO financial_entries (id, type, description, amount) VALUES (?, ?, ?, ?)",
        [randomUUID(), "expense", payload.description, payload.amount],
      );
      break;
    case "DELETE_EXPENSE":
      await pool.query(
        'DELETE FROM financial_entries WHERE id = ? AND type = "expense"',
        [payload.id],
      );
      break;
    case "ADD_TIP":
      await pool.query(
        "INSERT INTO financial_entries (id, type, description, amount) VALUES (?, ?, ?, ?)",
        [randomUUID(), "tip", payload.description, payload.amount],
      );
      break;
    case "DELETE_TIP":
      await pool.query(
        'DELETE FROM financial_entries WHERE id = ? AND type = "tip"',
        [payload.id],
      );
      break;
    case "CLOSE_REGISTER":
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [activeOrders]: any = await connection.query(
          "SELECT total FROM orders WHERE isAccounted = 0 AND isPaid = 1 AND status != 'cancelado'",
        );
        const [activeExpenses]: any = await connection.query(
          'SELECT amount FROM financial_entries WHERE isAccounted = 0 AND type = "expense"',
        );
        const [activeTips]: any = await connection.query(
          'SELECT amount FROM financial_entries WHERE isAccounted = 0 AND type = "tip"',
        );
        const [settingsResult]: any = await connection.query(
          "SELECT registerOpenedAt FROM store_settings WHERE id = 1",
        );

        const totalSales = activeOrders.reduce(
          (acc: number, o: any) => acc + Number(o.total),
          0,
        );
        const totalExpenses = activeExpenses.reduce(
          (acc: number, e: any) => acc + Number(e.amount),
          0,
        );
        const totalTips = activeTips.reduce(
          (acc: number, t: any) => acc + Number(t.amount),
          0,
        );

        await connection.query(
          "INSERT INTO cash_registers (id, openedAt, totalSales, totalExpenses, totalTips, netTotal, orderCount) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            randomUUID(),
            settingsResult[0].registerOpenedAt,
            totalSales,
            totalExpenses,
            totalTips,
            totalSales + totalTips - totalExpenses,
            activeOrders.length,
          ],
        );
        await connection.query(
          "UPDATE orders SET isAccounted = 1 WHERE isAccounted = 0 AND isPaid = 1",
        );
        await connection.query(
          "UPDATE financial_entries SET isAccounted = 1 WHERE isAccounted = 0",
        );
        await connection.query(
          "UPDATE store_settings SET registerOpenedAt = CURRENT_TIMESTAMP WHERE id = 1",
        );
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
      break;
  }
}

export async function validateBairro(bairro: string, cidade: string) {
  try {
    const [rows]: any = await pool.query(
      `SELECT taxa_entrega, ativo FROM bairros_atendidos WHERE nome LIKE ? AND cidade LIKE ? ORDER BY id DESC LIMIT 1`,
      [`%${bairro.trim()}%`, `%${cidade.trim()}%`],
    );
    if (rows.length === 0)
      return {
        valido: false,
        taxa_entrega: 0,
        mensagem: `Ainda não atendemos o bairro ${bairro.trim() || "informado"}.`,
      };
    if (rows[0].ativo === 0)
      return {
        valido: false,
        taxa_entrega: 0,
        mensagem: `As entregas para ${bairro.trim()} estão suspensas no momento.`,
      };
    return { valido: true, taxa_entrega: Number(rows[0].taxa_entrega) };
  } catch (error) {
    return {
      valido: false,
      taxa_entrega: 0,
      mensagem: "Erro ao validar endereço.",
    };
  }
}
