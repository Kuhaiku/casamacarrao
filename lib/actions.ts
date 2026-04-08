// lib/actions.ts
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
        ].includes(key)
      ) {
        newObj[key] = newObj[key] === 1;
      }
    }
  }
  return newObj;
};

export async function verifyAdminPassword(password: string) {
  return password === process.env.ADMIN_PASSWORD;
}

export async function verifyMotoboyPassword(password: string) {
  return password === process.env.MOTOBOY_PASSWORD;
}

export async function getStoreData() {
  const [sizes] = await pool.query("SELECT * FROM sizes");
  const [menuItems] = await pool.query("SELECT * FROM menu_items");
  const [productCategories] = await pool.query(
    "SELECT * FROM product_categories",
  );
  const [products] = await pool.query("SELECT * FROM products");
  const [settingsResult]: any = await pool.query(
    "SELECT * FROM store_settings WHERE id = 1",
  );
  const [orders] = await pool.query(
    "SELECT * FROM orders WHERE isAccounted = 0",
  );
  const [expenses] = await pool.query(
    "SELECT * FROM financial_entries WHERE type = ? AND isAccounted = 0",
    ["expense"],
  );
  const [tips] = await pool.query(
    "SELECT * FROM financial_entries WHERE type = ? AND isAccounted = 0",
    ["tip"],
  );
  const [registers] = await pool.query(
    "SELECT * FROM cash_registers ORDER BY closedAt DESC LIMIT 10",
  );

  const settings = settingsResult[0];

  return {
    sizes: (sizes as any[])
      .map(mapBooleans)
      .map((s) => ({ ...s, price: Number(s.price) })),
    
    // CORREÇÃO: Agora ele garante que o preço dos extras seja lido como Número (ou 0)
    menuItems: (menuItems as any[])
      .map(mapBooleans)
      .map((m) => ({ ...m, price: Number(m.price || 0) })),

    productCategories: (productCategories as any[]).map(mapBooleans),
    products: (products as any[])
      .map(mapBooleans)
      .map((p) => ({ ...p, price: Number(p.price) })),
    settings: {
      extraPastaPrice: Number(settings.extraPastaPrice || 0),
      extraSaucePrice: Number(settings.extraSaucePrice || 0),
      extraIngredientPrice: Number(settings.extraIngredientPrice || 0),
      whatsappMessage: settings.whatsappMessage,
      autoApprove: settings.autoApprove === 1 || settings.autoApprove === true,
    },
    registerOpenedAt: new Date(settings.registerOpenedAt).toISOString(),
    orders: (orders as any[]).map(mapBooleans).map((o) => ({
      ...o,
      total: Number(o.total),
      createdAt: new Date(o.createdAt).toISOString(),
      deliveredAt: o.deliveredAt ? new Date(o.deliveredAt).toISOString() : undefined,
      items: typeof o.items === "string" ? JSON.parse(o.items) : o.items,
      products: o.products
        ? typeof o.products === "string"
          ? JSON.parse(o.products)
          : o.products
        : [],
    })),
    expenses: (expenses as any[]).map(mapBooleans).map((e) => ({
      ...e,
      amount: Number(e.amount),
      date: new Date(e.date).toISOString(),
    })),
    tips: (tips as any[]).map(mapBooleans).map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: new Date(t.date).toISOString(),
    })),
    cashRegisters: (registers as any[]).map((r) => ({
      ...r,
      totalSales: Number(r.totalSales),
      totalExpenses: Number(r.totalExpenses),
      totalTips: Number(r.totalTips),
      netTotal: Number(r.netTotal),
      openedAt: new Date(r.openedAt).toISOString(),
      closedAt: new Date(r.closedAt).toISOString(),
    })),
  };
}

export async function dbDispatch(action: string, payload: any) {
  switch (action) {
    case "ADD_SIZE":
      await pool.query(
        "INSERT INTO sizes (id, name, price, maxPastas, strictMaxPastas, maxIngredients, strictMaxIngredients, maxSauces, strictMaxSauces) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          payload.id || randomUUID(),
          payload.name,
          payload.price,
          payload.maxPastas,
          payload.strictMaxPastas,
          payload.maxIngredients,
          payload.strictMaxIngredients,
          payload.maxSauces,
          payload.strictMaxSauces,
        ],
      );
      break;
    case "UPDATE_SIZE":
      await pool.query("UPDATE sizes SET ? WHERE id = ?", [
        payload.updates,
        payload.id,
      ]);
      break;
    case "DELETE_SIZE":
      await pool.query("DELETE FROM sizes WHERE id = ?", [payload.id]);
      break;
    case "ADD_MENU_ITEM":
      // CORREÇÃO: Adicionada a coluna "price" no INSERT para salvar no MySQL
      await pool.query(
        "INSERT INTO menu_items (id, name, category, isActive, price) VALUES (?, ?, ?, ?, ?)",
        [
          payload.id || randomUUID(),
          payload.name,
          payload.category,
          payload.isActive,
          payload.price || 0, // Se não for um extra, salva como 0
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
    case "UPDATE_SETTINGS":
      await pool.query("UPDATE store_settings SET ? WHERE id = 1", [payload]);
      break;
    case "ADD_PRODUCT_CATEGORY":
      await pool.query(
        "INSERT INTO product_categories (id, name, isActive) VALUES (?, ?, ?)",
        [payload.id || randomUUID(), payload.name, payload.isActive ?? true],
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
        "INSERT INTO products (id, categoryId, name, price, isActive) VALUES (?, ?, ?, ?, ?)",
        [
          payload.id || randomUUID(),
          payload.categoryId,
          payload.name,
          payload.price,
          payload.isActive ?? true,
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

    case "ADD_ORDER": {
      const [settingRows]: any = await pool.query(
        "SELECT autoApprove FROM store_settings WHERE id = 1",
      );
      const isAutoApprove =
        settingRows[0]?.autoApprove === 1 ||
        settingRows[0]?.autoApprove === true;
      const finalStatus = isAutoApprove ? "aprovado" : payload.status || "novo";

      await pool.query(
        "INSERT INTO orders (id, customerName, phone, address, paymentMethod, status, isPaid, total, items, products, observation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          payload.id || randomUUID(),
          payload.customerName,
          payload.phone,
          payload.address,
          payload.paymentMethod,
          finalStatus,
          payload.isPaid,
          payload.total,
          JSON.stringify(payload.items),
          JSON.stringify(payload.products || []),
          payload.observation || "",
        ],
      );
      break;
    }

    case "UPDATE_ORDER_STATUS":
      if (payload.deliveredAt) {
        await pool.query("UPDATE orders SET status = ?, deliveredAt = ? WHERE id = ?", [
          payload.status,
          new Date(payload.deliveredAt),
          payload.id,
        ]);
      } else {
        await pool.query("UPDATE orders SET status = ? WHERE id = ?", [
          payload.status,
          payload.id,
        ]);
      }

      if (payload.status === "cancelado") {
        await pool.query("UPDATE orders SET isPaid = 0 WHERE id = ?", [
          payload.id,
        ]);
      }
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