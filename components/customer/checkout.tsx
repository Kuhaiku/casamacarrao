// components/customer/checkout.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useStore } from "@/lib/store"
import { useOrder } from "@/lib/order-context"
import { validateBairro } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { createPaymentPreference } from "@/lib/mercadopago-actions"
import { useGoogleAddress } from "@/hooks/use-google-address"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { CreditCard, Banknote, QrCode, ChevronLeft, PartyPopper, Loader2, AlertCircle } from "lucide-react"

import type { OrderProduct, OrderStatus, BairroValidation } from "@/lib/types"

function formatCurrency(value: number) {
  const safeValue = (typeof value === "number" && !isNaN(value)) ? value : 0;
  return safeValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function SuccessScreen() {
  const { resetOrder } = useOrder()
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <PartyPopper className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3">Pedido Recebido!</h1>
      <p className="text-muted-foreground mb-8">Acompanhe seu pedido pelo WhatsApp.</p>
      <Button size="lg" onClick={resetOrder}>Fazer Novo Pedido</Button>
    </div>
  )
}

export function Checkout() {
  const router = useRouter()
  const { toast } = useToast()
  const { addOrder, calculateOrderTotal, sizes, products, settings } = useStore()
  const { items, customerName, setCustomerName, paymentMethod, setPaymentMethod, setStep } = useOrder()

  const [tipoPedido, setTipoPedido] = useState<"delivery" | "mesa">("delivery")
  const [phone, setPhone] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([])
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [isValidatingArea, setIsValidatingArea] = useState(false)
  const [bairroStatus, setBairroStatus] = useState<BairroValidation | null>(null)

  const { inputRef, addressData, setAddressData } = useGoogleAddress(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "")

  useEffect(() => {
    const checkArea = async () => {
      if (tipoPedido !== "delivery" || !addressData.bairro || !addressData.cidade) {
        setBairroStatus(null)
        return
      }

      setIsValidatingArea(true)
      const res = await validateBairro(addressData.bairro, addressData.cidade)
      setBairroStatus(res)
      setIsValidatingArea(false)

      if (!res.valido) {
        toast({ variant: "destructive", title: "Área Bloqueada", description: res.mensagem })
      }
    }

    const timer = setTimeout(checkArea, 800)
    return () => clearTimeout(timer)
  }, [addressData.bairro, addressData.cidade, tipoPedido, toast])

  const subtotal = useMemo(() => calculateOrderTotal(items, selectedProducts) || 0, [items, selectedProducts, calculateOrderTotal]);

  const taxaEmbalagem = useMemo(() => {
    if (tipoPedido === "mesa") return 0;
    const taxaGlobal = Number(settings.taxaEmbalagemGlobal) || 2.00;
    
    const produtosFee = selectedProducts.reduce((acc, sp) => {
      const prod = products.find(p => p.id === sp.productId);
      if (!prod) return acc;
      
      let itemFee = 0;
      if (prod.tipoEmbalagem === 'padrao') itemFee = taxaGlobal;
      else if (prod.tipoEmbalagem === 'personalizada') itemFee = Number(prod.taxaEmbalagem) || 0;
      else if (prod.tem_embalagem) itemFee = taxaGlobal;
      
      return acc + (itemFee * sp.quantity);
    }, 0);

    const macarraoFee = items.reduce((acc, item) => {
      const size = sizes.find(s => s.id === item.sizeId);
      const fee = size?.taxaEmbalagem ? Number(size.taxaEmbalagem) : taxaGlobal;
      return acc + fee;
    }, 0);
    
    return produtosFee + macarraoFee;
  }, [tipoPedido, items, selectedProducts, products, settings.taxaEmbalagemGlobal, sizes]);

  const taxaEntrega = tipoPedido === "delivery" && bairroStatus?.valido ? (Number(bairroStatus.taxa_entrega) || 0) : 0;
  
  const taxaCartao = useMemo(() => {
    if (paymentMethod !== "cartao") return 0;
    const baseSegura = Number(subtotal) + Number(taxaEmbalagem) + Number(taxaEntrega);
    const percentual = Number(settings?.taxaCartaoPercentual) || 0;
    const fixa = Number(settings?.taxaCartaoFixa) || 0;
    const resultado = (baseSegura * (percentual / 100)) + fixa;
    return isNaN(resultado) ? 0 : resultado;
  }, [paymentMethod, subtotal, taxaEmbalagem, taxaEntrega, settings]);

  const total = Number(subtotal) + Number(taxaEmbalagem) + Number(taxaEntrega) + Number(taxaCartao);

  const missingFields = useMemo(() => {
    const missing = [];
    if (!customerName?.trim()) missing.push("Nome");
    if (!phone?.trim()) missing.push("WhatsApp");
    if (tipoPedido === "delivery") {
      if (!addressData.logradouro?.trim()) missing.push("Rua");
      if (!addressData.numero?.trim()) missing.push("Nº (ou SN)");
      if (!bairroStatus?.valido) missing.push("Bairro Atendido");
    }
    return missing;
  }, [customerName, phone, tipoPedido, addressData, bairroStatus]);

  const isBlockSubmit = settings.isOpen === false || items.length === 0 || missingFields.length > 0 || isProcessing || (tipoPedido === "delivery" && isValidatingArea);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isBlockSubmit) return

    setIsProcessing(true)
    const finalAddress = `${addressData.logradouro}, Nº ${addressData.numero} - ${addressData.bairro}, ${addressData.cidade}`
    
    const orderData: any = {
      id: crypto.randomUUID(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: tipoPedido === "delivery" ? finalAddress : (tipoPedido === "mesa" ? "Mesa" : "Retirada"), 
      paymentMethod,
      items,
      products: selectedProducts,
      status: (paymentMethod === "cartao" ? "aguardando_pagamento" : "novo") as OrderStatus,
      isPaid: false,
      tipoPedido,
      subtotal,
      taxaEmbalagem,
      taxaEntrega,
      taxaCartao,
      total,
      createdAt: new Date().toISOString()
    }

    try {
      await addOrder(orderData)

      if (paymentMethod === "cartao") {
        const totalFinal = Number(total.toFixed(2));
        if (isNaN(totalFinal) || totalFinal <= 0) throw new Error("Valor inválido");

        const res = await createPaymentPreference(orderData, totalFinal)
        if (res.success && res.init_point) {
          window.location.href = res.init_point
          return
        } else {
          throw new Error("Falha no link do Mercado Pago");
        }
      }
      
      router.push(`/pedido/${orderData.id}`)
    } catch (err) {
      toast({ variant: "destructive", title: "Erro no Pedido", description: "Não foi possível processar o pagamento. Tente novamente." })
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto p-4">
      <div className="space-y-6">
        
        {settings.isOpen === false && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-bold">Aviso Importante</AlertTitle>
            <AlertDescription>Nosso delivery está fora de atendimento no momento.</AlertDescription>
          </Alert>
        )}

        <Card>
          <form id="checkout-form" onSubmit={handleSubmit}>
            <CardHeader><CardTitle>Finalizar Pedido</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <Button type="button" variant={tipoPedido === "delivery" ? "default" : "outline"} onClick={() => setTipoPedido("delivery")} disabled={!settings.isOpen}>Delivery</Button>
                <Button type="button" variant={tipoPedido === "mesa" ? "default" : "outline"} onClick={() => setTipoPedido("mesa")} disabled={!settings.isOpen}>Retirada / Mesa</Button>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={!settings.isOpen} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(22) 99999-9999" disabled={!settings.isOpen} />
                </div>

                {tipoPedido === "delivery" && (
                  <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                    <div className="space-y-2">
                      <Label>Buscar Endereço</Label>
                      <Input ref={inputRef} placeholder="Digite seu endereço e selecione..." disabled={!settings.isOpen} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-2">
                        <Label>Logradouro</Label>
                        <Input value={addressData.logradouro} readOnly disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Nº</Label>
                        <Input value={addressData.numero} onChange={(e) => setAddressData({...addressData, numero: e.target.value})} disabled={!settings.isOpen} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Bairro {isValidatingArea && <Loader2 className="inline h-3 w-3 animate-spin ml-2" />}</Label>
                        <Input value={addressData.bairro} readOnly disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input value={addressData.cidade} readOnly disabled />
                      </div>
                    </div>
                    {bairroStatus?.valido === false && (
                      <p className="text-sm text-destructive font-medium mt-1">{bairroStatus.mensagem}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label>Forma de Pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setPaymentMethod("pix")} disabled={!settings.isOpen} className={cn("p-3 rounded-lg border-2 flex flex-col items-center gap-1", paymentMethod === "pix" ? "border-primary bg-primary/5" : "border-border opacity-70")}>
                    <QrCode className="h-5 w-5" /> <span className="text-xs font-medium">PIX</span>
                  </button>
                  <button type="button" onClick={() => setPaymentMethod("dinheiro")} disabled={!settings.isOpen} className={cn("p-3 rounded-lg border-2 flex flex-col items-center gap-1", paymentMethod === "dinheiro" ? "border-primary bg-primary/5" : "border-border opacity-70")}>
                    <Banknote className="h-5 w-5" /> <span className="text-xs font-medium">Dinheiro</span>
                  </button>
                  
                  {/* TRAVA DUPLA: Verifica se o Mercado Pago está ativo E se a loja aceita cartão */}
                  {settings.mercadoPagoAtivo === true && (
                    <button type="button" onClick={() => setPaymentMethod("cartao")} disabled={!settings.isOpen} className={cn("p-3 rounded-lg border-2 flex flex-col items-center gap-1", paymentMethod === "cartao" ? "border-primary bg-primary/5" : "border-border opacity-70")}>
                      <CreditCard className="h-5 w-5" /> <span className="text-xs font-medium">Cartão</span>
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="sticky top-6">
          <CardHeader><CardTitle>Resumo do Pedido</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {items.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-muted rounded flex justify-between">
                      <span>1x {sizes.find(s => s.id === item.sizeId)?.name}</span>
                  </div>
              ))}
              {selectedProducts.map(sp => {
                const prod = products.find(p => p.id === sp.productId)
                return (
                  <div key={sp.productId} className="flex justify-between text-sm italic">
                      <span>{sp.quantity}x {prod?.name}</span>
                      <span>{formatCurrency((prod?.price || 0) * sp.quantity)}</span>
                  </div>
                )
              })}
            </div>

            <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {taxaEmbalagem > 0 && (
                <div className="flex justify-between">
                  <span>Taxa de Embalagem</span>
                  <span>{formatCurrency(taxaEmbalagem)}</span>
                </div>
              )}
              {tipoPedido === "delivery" && (
                <div className="flex justify-between">
                  <span>Taxa de Entrega</span>
                  <span>
                    {isValidatingArea ? <Loader2 className="h-3 w-3 animate-spin" /> : taxaEntrega > 0 ? formatCurrency(taxaEntrega) : "---"}
                  </span>
                </div>
              )}
              {taxaCartao > 0 && (
                <div className="flex justify-between text-orange-600 font-medium">
                  <span>Taxa Cartão de Crédito</span>
                  <span>{formatCurrency(taxaCartao)}</span>
                </div>
              )}
            </div>

          </CardContent>
          <CardFooter className="flex-col gap-4 border-t pt-6 bg-muted/10">
            <div className="flex justify-between w-full text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>

            {missingFields.length > 0 && settings.isOpen && items.length > 0 && (
              <div className="w-full text-center animate-in fade-in zoom-in mt-2 mb-1">
                <p className="text-xs font-black text-red-600 uppercase tracking-wider bg-red-50 py-2 px-3 rounded-lg border border-red-100 inline-block w-full">
                  ⚠️ Falta preencher: {missingFields.join(", ")}
                </p>
              </div>
            )}

            <Button type="submit" form="checkout-form" className="w-full" size="lg" disabled={isBlockSubmit}>
              {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirmar Pedido"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep(0)} className="w-full" disabled={isProcessing}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Editar Carrinho
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}