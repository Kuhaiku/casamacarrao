// lib/mercadopago.ts (ou dentro de actions.ts)
"use server";

import { MercadoPagoConfig, Preference } from 'mercadopago';

// O token deve vir do seu .env
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export async function createPaymentPreference(orderData: any, total: number) {
  try {
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            id: orderData.id,
            title: `Pedido Casa do Macarrão - ${orderData.customerName}`,
            quantity: 1,
            unit_price: total,
            currency_id: 'BRL',
          }
        ],
        payer: {
          name: orderData.customerName,
          // Você pode extrair o DDD e o número do estado do telefone aqui
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${orderData.id}/sucesso`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${orderData.id}/falha`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${orderData.id}/pendente`
        },
        auto_return: 'approved',
        // O webhook que receberá as atualizações de pagamento
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      }
    });

    return { success: true, init_point: response.init_point };
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    return { success: false, error: "Falha ao gerar pagamento" };
  }
}