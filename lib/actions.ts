"use server";

import { pool } from "./db";
import { randomUUID } from "crypto";

const mapBooleans = (obj: any) => {
  const newObj = { ...obj };
  for (const key in newObj) {
    if (typeof newObj[key] === "number" && (newObj[key] === 1 || newObj[key] === 0)) {
      if ([
        "strictMaxPastas", "strictMaxIngredients", "strictMaxSauces", "isActive", 
        "isPaid", "isAccounted", "isOpen", "mercadoPagoAtivo", "tem_embalagem",
        "autoApprove", "autoApproveMesa", "ativo", 
        "acceptCard" // ADICIONADO AQUI
      ].includes(key)) {
        newObj[key] = newObj[key] === 1;
      }
    }
  }
  return newObj;
};

export async function verifyFinanceiroPassword(password: string) {
  return password === process.env.FINANCEIRO_PASSWORD;
}

export async function getStoreData() {
  try {
    const [sizes] = await pool.query("SELECT * FROM sizes");
    const [menuItems] = await pool.query("SELECT * FROM menu_items");
    const [productCategories] = await pool.query("SELECT * FROM product_categories");
    const [products] = await pool.query("SELECT * FROM products");
    const [bairros] = await pool.query("SELECT * FROM bairros_atendidos ORDER BY nome ASC");
    const [settingsResult]: any = await pool.query("SELECT * FROM store_settings WHERE id = 1");
    
    const [orders] = await pool.query("SELECT * FROM orders ORDER BY createdAt DESC LIMIT 1500");
    const [expenses] = await pool.query("SELECT * FROM financial_entries WHERE type = 'expense' ORDER BY id DESC LIMIT 500");
    const [tips] = await pool.query("SELECT * FROM financial_entries WHERE type = 'tip' ORDER BY id DESC LIMIT 500");
    const [registers] = await pool.query("SELECT * FROM cash_registers ORDER BY closedAt DESC LIMIT 30");

    const settings = settingsResult[0] || {};
    
    // ENRAIZANDO A SEGUNDA-FEIRA (Dia 1 = Segunda)
    let parsedSchedule = settings.deliverySchedule ? JSON.parse(settings.deliverySchedule) : null;
    if (parsedSchedule && parsedSchedule["1"]) {
       parsedSchedule["1"].active = false; // Força sempre a ser falso
    }

    return {
      sizes: (sizes as any[]).map(mapBooleans).map((s) => ({ ...s, price: Number(s.price) })),
      menuItems: (menuItems as any[]).map(mapBooleans).map((m) => ({ ...m, price: Number(m.price || 0) })),
      productCategories: (productCategories as any[]).map(mapBooleans),
      products: (products as any[]).map(mapBooleans).map((p) => ({ ...p, price: Number(p.price) })),
      bairros: (bairros as any[]).map(mapBooleans).map(b => ({ ...b, taxa_entrega: Number(b.taxa_entrega) })),
      settings: {
        ...settings,
        autoApprove: settings.autoApprove === 1 || settings.autoApprove === true,
        autoApproveMesa: settings.autoApproveMesa === 1 || settings.autoApproveMesa === true,
        isOpen: settings.isOpen === 1 || settings.isOpen === true,
        acceptCard: settings.acceptCard === 1 || settings.acceptCard === true,
        mercadoPagoAtivo: settings.mercadoPagoAtivo === 1 || settings.mercadoPagoAtivo === true,
        deliverySchedule: parsedSchedule
      },
      orders: (orders as any[]).map(mapBooleans).map((o) => ({
        ...o,
        total: Number(o.total),
        createdAt: new Date(o.createdAt).toISOString(),
        deliveredAt: o.deliveredAt ? new Date(o.deliveredAt).toISOString() : undefined,
        approvedAt: o.approvedAt ? new Date(o.approvedAt).toISOString() : undefined,
        items: typeof o.items === "string" ? JSON.parse(o.items) : o.items,
        products: o.products ? (typeof o.products === "string" ? JSON.parse(o.products) : o.products) : [],
      })),
      expenses: (expenses as any[]).map(mapBooleans).map((e) => ({ ...e, amount: Number(e.amount) })),
      tips: (tips as any[]).map(mapBooleans).map((t) => ({ ...t, amount: Number(t.amount) })),
      cashRegisters: (registers as any[]).map((r) => ({ ...r, netTotal: Number(r.netTotal) })),
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
      
      // Converte horários para string JSON e enraiza a segunda-feira
      if (validPayload.deliverySchedule) {
        if (validPayload.deliverySchedule["1"]) {
           validPayload.deliverySchedule["1"].active = false; 
        }
        validPayload.deliverySchedule = JSON.stringify(validPayload.deliverySchedule);
      }
      
      // Converte booleanos para 1 ou 0
      for (const key in validPayload) {
        if (typeof validPayload[key] === "boolean") {
          validPayload[key] = validPayload[key] ? 1 : 0;
        }
      }

      delete validPayload.bairros;
      // Removido o 'delete validPayload.acceptCard' para que ele possa ser salvo no banco.

      // Proteção: Se não sobrar nada para atualizar, apenas sai sem dar erro
      if (Object.keys(validPayload).length === 0) break;

      await pool.query("UPDATE store_settings SET ? WHERE id = 1", [validPayload]);
      break;
    }
    case "ADD_BAIRRO":
      await pool.query("INSERT INTO bairros_atendidos (nome, cidade, taxa_entrega, ativo) VALUES (?, ?, ?, ?)", 
        [payload.nome, payload.cidade, payload.taxa_entrega, payload.ativo ? 1 : 0]);
      break;
    case "UPDATE_BAIRRO":
      await pool.query("UPDATE bairros_atendidos SET ? WHERE id = ?", [payload.updates, payload.id]);
      break;
    case "DELETE_BAIRRO":
      await pool.query("DELETE FROM bairros_atendidos WHERE id = ?", [payload.id]);
      break;
    case "TOGGLE_BAIRRO":
      await pool.query("UPDATE bairros_atendidos SET ativo = NOT ativo WHERE id = ?", [payload.id]);
      break;
    case "ADD_ORDER": {
      const [settingRows]: any = await pool.query("SELECT * FROM store_settings WHERE id = 1");
      const isMesa = payload.tipoPedido === "mesa" || (payload.address && payload.address.toLowerCase().includes("mesa"));
      
      // Validação reforçada para aceitar tanto 1 quanto true vindo do banco
      const isAutoMesa = settingRows[0].autoApproveMesa === 1 || settingRows[0].autoApproveMesa === true;
      const isAutoDelivery = settingRows[0].autoApprove === 1 || settingRows[0].autoApprove === true;
      
      const isAuto = isMesa ? isAutoMesa : isAutoDelivery;
      
      const status = isAuto ? "aprovado" : "novo";
      const approvedAt = isAuto ? new Date() : null;

      await pool.query(
        "INSERT INTO orders (id, customerName, phone, address, paymentMethod, status, isPaid, total, items, products, observation, approvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [payload.id || randomUUID(), payload.customerName, payload.phone || "0", payload.address || "Balcão", payload.paymentMethod || "PIX", status, payload.isPaid ? 1 : 0, payload.total, JSON.stringify(payload.items), JSON.stringify(payload.products || []), payload.observation || "", approvedAt]
      );
      break;
    }
    case "UPDATE_ORDER_STATUS":
      const updateData: any = { status: payload.status };
      if (payload.status === "aprovado") updateData.approvedAt = new Date();
      if (payload.deliveredAt) updateData.deliveredAt = new Date(payload.deliveredAt);
      await pool.query("UPDATE orders SET ? WHERE id = ?", [updateData, payload.id]);
      break;
    case "TOGGLE_ORDER_PAID":
      await pool.query("UPDATE orders SET isPaid = NOT isPaid WHERE id = ?", [payload.id]);
      break;
    case "ADD_EXPENSE":
      await pool.query("INSERT INTO financial_entries (id, type, description, amount) VALUES (?, ?, ?, ?)", [randomUUID(), "expense", payload.description, payload.amount]);
      break;
    case "DELETE_EXPENSE":
      await pool.query('DELETE FROM financial_entries WHERE id = ? AND type = "expense"', [payload.id]);
      break;
    case "ADD_TIP":
      await pool.query("INSERT INTO financial_entries (id, type, description, amount) VALUES (?, ?, ?, ?)", [randomUUID(), "tip", payload.description, payload.amount]);
      break;
    case "DELETE_TIP":
      await pool.query('DELETE FROM financial_entries WHERE id = ? AND type = "tip"', [payload.id]);
      break;
    case "CLOSE_REGISTER":
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [activeOrders]: any = await connection.query("SELECT total FROM orders WHERE isAccounted = 0 AND isPaid = 1 AND status != 'cancelado'");
        const [activeExpenses]: any = await connection.query('SELECT amount FROM financial_entries WHERE isAccounted = 0 AND type = "expense"');
        const [activeTips]: any = await connection.query('SELECT amount FROM financial_entries WHERE isAccounted = 0 AND type = "tip"');
        const [settingsResult]: any = await connection.query("SELECT registerOpenedAt FROM store_settings WHERE id = 1");
        
        const totalSales = activeOrders.reduce((acc: number, o: any) => acc + Number(o.total), 0);
        const totalExpenses = activeExpenses.reduce((acc: number, e: any) => acc + Number(e.amount), 0);
        const totalTips = activeTips.reduce((acc: number, t: any) => acc + Number(t.amount), 0);

        await connection.query(
          "INSERT INTO cash_registers (id, openedAt, totalSales, totalExpenses, totalTips, netTotal, orderCount) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [randomUUID(), settingsResult[0].registerOpenedAt, totalSales, totalExpenses, totalTips, totalSales + totalTips - totalExpenses, activeOrders.length]
        );
        await connection.query("UPDATE orders SET isAccounted = 1 WHERE isAccounted = 0 AND isPaid = 1");
        await connection.query("UPDATE financial_entries SET isAccounted = 1 WHERE isAccounted = 0");
        await connection.query("UPDATE store_settings SET registerOpenedAt = CURRENT_TIMESTAMP WHERE id = 1");
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
      [`%${bairro.trim()}%`, `%${cidade.trim()}%`]
    );
    if (rows.length === 0) return { valido: false, taxa_entrega: 0, mensagem: `Ainda não atendemos o bairro ${bairro.trim() || 'informado'}.` };
    if (rows[0].ativo === 0) return { valido: false, taxa_entrega: 0, mensagem: `As entregas para ${bairro.trim()} estão suspensas no momento.` };
    return { valido: true, taxa_entrega: Number(rows[0].taxa_entrega) };
  } catch (error) {
    return { valido: false, taxa_entrega: 0, mensagem: "Erro ao validar endereço." };
  }
}