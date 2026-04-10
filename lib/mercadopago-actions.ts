"use server";

import { MercadoPagoConfig, Preference } from 'mercadopago';

// Deixe as credenciais no .env para segurança
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'SUA_CHAVE_TESTE' });

export async function createPaymentPreference(orderData: any, total: number) {
  try {
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [{
          id: orderData.id,
          title: `Pedido Casa do Macarrão - ${orderData.customerName}`,
          quantity: 1,
          unit_price: total,
          currency_id: 'BRL',
        }],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/sucesso`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/falha`,
        },
        auto_return: 'approved',
      }
    });

    return { success: true, init_point: response.init_point };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}