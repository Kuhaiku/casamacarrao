"use server"

import { MercadoPagoConfig, Preference } from 'mercadopago'
import type { Order } from './types'

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
})

export async function createPaymentPreference(orderData: Order, totalFinal: number) {
  try {
    const preference = new Preference(client)

    // Arredonda para 2 casas decimais para evitar erro na API do Mercado Pago
    const unitPrice = Number(totalFinal.toFixed(2))

    const response = await preference.create({
      body: {
        items: [
          {
            id: orderData.id,
            title: `Pedido Delivery - ${orderData.customerName}`,
            description: `Tipo: ${orderData.tipoPedido} | Taxas inclusas no total.`,
            quantity: 1,
            unit_price: unitPrice,
            currency_id: 'BRL',
          }
        ],
        payer: {
          name: orderData.customerName,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${orderData.id}?status=sucesso`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${orderData.id}?status=falha`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${orderData.id}?status=pendente`,
        },
        auto_return: 'approved',
        external_reference: orderData.id,
      }
    })

    return { success: true, init_point: response.init_point }
  } catch (error) {
    console.error("Erro ao gerar link do Mercado Pago:", error)
    return { success: false, init_point: null }
  }
}