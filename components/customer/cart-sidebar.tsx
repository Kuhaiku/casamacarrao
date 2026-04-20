"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  Trash2,
  Smartphone,
  Banknote,
  CreditCard,
  Loader2,
  MapPin,
  ChevronRight,
  ChevronLeft,
  User,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { validateBairro } from "@/lib/actions";
import { createPaymentPreference } from "@/lib/mercadopago-actions";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";

export function CartSidebar(props: any) {
  const { toast } = useToast();
  const { menuItems } = useStore(); // Puxa os itens do menu para traduzir os IDs
  const {
    cartSubtotal,
    totalItemsCount,
    cartSelfService,
    cartAvulsos,
    handleRemoveSelfService,
    handleRemoveAvulso,
    sizes,
    settings,
    formatCurrency,
    setIsMobileCartOpen,
    addOrder,
    router,
    products,
  } = props;

  const isCartEmpty = totalItemsCount === 0;

  // Estado para controlar a etapa da sacola (1 = Lista de Itens, 2 = Dados/Pagamento)
  const [step, setStep] = useState<1 | 2>(1);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState<"pix" | "dinheiro" | "cartao">("pix");
  const [observation, setObservation] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [addressData, setAddressData] = useState({
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  const [isValidatingArea, setIsValidatingArea] = useState(false);
  const [bairroStatus, setBairroStatus] = useState<{
    valido: boolean;
    taxa_entrega: number;
    mensagem?: string;
  } | null>(null);

  useEffect(() => {
    const checkArea = async () => {
      if (!addressData.bairro) {
        setBairroStatus({
          valido: false,
          taxa_entrega: 0,
          mensagem: "Informe o bairro para calcular a entrega",
        });
        return;
      }

      setIsValidatingArea(true);
      const res = await validateBairro(
        addressData.bairro,
        addressData.cidade || "Araruama",
      );
      setBairroStatus(res);
      setIsValidatingArea(false);
    };

    const timer = setTimeout(checkArea, 800);
    return () => clearTimeout(timer);
  }, [addressData.bairro, addressData.cidade]);

  const taxaEmbalagem = useMemo(() => {
    const taxaGlobal = Number(settings.taxaEmbalagemGlobal) || 2.0;

    const taxaSelfService = cartSelfService.reduce((acc: number, item: any) => {
      const size = sizes.find((s: any) => s.id === item.sizeId);
      const fee = size?.taxaEmbalagem ? Number(size.taxaEmbalagem) : taxaGlobal;
      return acc + fee;
    }, 0);

    const taxaAvulsos = cartAvulsos.reduce((acc: number, item: any) => {
      const prod = products.find((p: any) => p.id === item.productId);
      if (!prod) return acc;

      let itemFee = 0;
      if (prod.tipoEmbalagem === "padrao") {
        itemFee = taxaGlobal;
      } else if (prod.tipoEmbalagem === "personalizada") {
        itemFee = Number(prod.taxaEmbalagem) || 0;
      } else if (prod.tem_embalagem) {
        itemFee = taxaGlobal;
      }

      return acc + itemFee * item.quantity;
    }, 0);

    return taxaSelfService + taxaAvulsos;
  }, [cartSelfService, cartAvulsos, products, settings, sizes]);

  const taxaEntrega = bairroStatus?.valido ? bairroStatus.taxa_entrega : 0;

  const taxaCartao = useMemo(() => {
    if (payment !== "cartao") return 0;

    const base =
      Number(cartSubtotal) + Number(taxaEmbalagem) + Number(taxaEntrega);
    const percentual = Number(settings.taxaCartaoPercentual) || 0;

    return base * (percentual / 100);
  }, [payment, cartSubtotal, taxaEmbalagem, taxaEntrega, settings]);

  const totalFinal =
    Number(cartSubtotal) +
    Number(taxaEmbalagem) +
    Number(taxaEntrega) +
    Number(taxaCartao);

  const missingFields = useMemo(() => {
    const missing = [];
    if (!customerName?.trim()) missing.push("Nome");
    if (!phone?.trim()) missing.push("WhatsApp");
    if (!addressData.logradouro?.trim()) missing.push("Rua");
    if (!addressData.numero?.trim()) missing.push("Nº");
    if (!bairroStatus?.valido) missing.push("Bairro Atendido");
    return missing;
  }, [customerName, phone, addressData, bairroStatus]);

  const isBlockSubmit =
    settings.isOpen === false ||
    isCartEmpty ||
    missingFields.length > 0 ||
    isProcessing ||
    isValidatingArea;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Erro",
        description: "GPS não suportado.",
        variant: "destructive",
      });
      return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await res.json();
          if (data && data.address) {
            setAddressData({
              logradouro: data.address.road || "",
              numero: "",
              bairro: data.address.suburb || data.address.neighbourhood || "",
              cidade: data.address.city || data.address.town || "Araruama",
              estado: data.address.state || "RJ",
              cep: data.address.postcode || "",
            });
            toast({
              title: "Localizado!",
              description: "Confirme os dados e adicione o número.",
            });
          }
        } catch (error) {
          toast({
            title: "Erro",
            description: "Falha ao obter endereço.",
            variant: "destructive",
          });
        } finally {
          setIsFetchingLocation(false);
        }
      },
      () => {
        setIsFetchingLocation(false);
        toast({
          title: "GPS Desativado",
          description: "Ative a localização no seu celular.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleFinalize = async () => {
    if (isBlockSubmit) return;

    setIsProcessing(true);
    const finalAddress = `${addressData.logradouro}, Nº ${addressData.numero} - ${addressData.bairro}, ${addressData.cidade}`;
    const trackingId = crypto.randomUUID();

    const orderData: any = {
      id: trackingId,
      customerName,
      phone,
      address: finalAddress,
      paymentMethod: payment,
      items: cartSelfService,
      products: cartAvulsos.map((p: any) => ({
        productId: p.productId,
        quantity: p.quantity,
      })),
      observation,
      total: totalFinal,
      status: payment === "cartao" ? "aguardando_pagamento" : "novo",
      isPaid: false,
      isAccounted: false,
      tipoPedido: "delivery",
      taxaEmbalagem,
      taxaEntrega,
      taxaCartao,
      subtotal: cartSubtotal,
      createdAt: new Date().toISOString(),
    };

    await addOrder(orderData);

    if (payment === "cartao") {
      const totalMercadoPago = Number(totalFinal.toFixed(2));
      const res = await createPaymentPreference(orderData, totalMercadoPago);
      if (res.success && res.init_point) {
        window.location.href = res.init_point;
        return;
      } else {
        toast({
          title: "Erro de Pagamento",
          description: "Não gerou link do Mercado Pago.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
    }

    setIsProcessing(false);
    router.push(`/pedido/${trackingId}`);
  };

  const getItemName = (id: string) => {
    const item = menuItems?.find((m: any) => m.id === id);
    return item ? item.name : "Item";
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-50">
      {/* HEADER DA SACOLA */}
      <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between shrink-0 z-10 shadow-sm">
        {step === 1 ? (
          <h2 className="text-lg font-black text-stone-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-600" /> Sua Sacola
          </h2>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep(1)}
              className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-stone-800">
              Finalizar Pedido
            </h2>
          </div>
        )}
        <button
          onClick={() => setIsMobileCartOpen(false)}
          className="lg:hidden text-stone-600 font-bold px-3 py-1.5 text-[11px] uppercase bg-stone-100 rounded-lg active:scale-95"
        >
          Fechar
        </button>
      </div>

      {/* ÁREA ROLÁVEL PRINCIPAL */}
      <div className="flex-1 overflow-y-auto pb-4">
        {settings.isOpen === false && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-red-800 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-bold">
              Nosso delivery está fora de atendimento no momento.
            </p>
          </div>
        )}

        {isCartEmpty ? (
          <div className="text-center py-16 text-stone-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Sua sacola está vazia.</p>
          </div>
        ) : step === 1 ? (
          /* =================== PASSO 1: LISTA DETALHADA =================== */
          <div className="p-4 space-y-4">
            {cartSelfService.map((item: any) => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start border-b border-stone-100 pb-2">
                  <span className="font-black text-stone-800 text-sm">
                    Macarrão{" "}
                    {sizes.find((s: any) => s.id === item.sizeId)?.name}
                  </span>
                  <button
                    onClick={() => handleRemoveSelfService(item.id)}
                    className="text-stone-400 hover:text-red-500 bg-red-50/50 p-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                <div className="text-[12px] text-stone-600 leading-snug space-y-1.5 pl-2 border-l-2 border-orange-200">
                  {item.pastaId && (
                    <div>
                      <span className="font-bold text-stone-400">Massa:</span>{" "}
                      {getItemName(item.pastaId)}
                    </div>
                  )}
                  {item.sauces?.length > 0 && (
                    <div>
                      <span className="font-bold text-stone-400">Molhos:</span>{" "}
                      {item.sauces.map(getItemName).join(", ")}
                    </div>
                  )}
                  {item.temperos?.length > 0 && (
                    <div>
                      <span className="font-bold text-stone-400">
                        Temperos:
                      </span>{" "}
                      {item.temperos.map(getItemName).join(", ")}
                    </div>
                  )}
                  {item.ingredients?.length > 0 && (
                    <div>
                      <span className="font-bold text-stone-400">
                        Ingredientes:
                      </span>{" "}
                      {item.ingredients.map(getItemName).join(", ")}
                    </div>
                  )}
                  {item.extras?.length > 0 && (
                    <div className="text-amber-700">
                      <span className="font-bold text-amber-500">Extras:</span>{" "}
                      {item.extras.map(getItemName).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {cartAvulsos.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-black text-stone-800 text-sm mt-2 ml-1">
                  Itens Avulsos
                </h3>
                {cartAvulsos.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-white p-3 rounded-xl border border-stone-200 shadow-sm"
                  >
                    <span className="text-sm font-bold text-stone-700">
                      {item.quantity}x {item.product.name}
                    </span>
                    <button
                      onClick={() => handleRemoveAvulso(item.id)}
                      className="text-stone-400 hover:text-red-500 p-1.5 rounded-lg bg-red-50/50"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* =================== PASSO 2: DADOS DE ENTREGA =================== */
          <div className="p-4 space-y-6">
            <div className="space-y-3">
              <h3 className="font-black text-stone-800 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-orange-600" /> Seus Dados
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  placeholder="Nome Completo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={!settings.isOpen}
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-[16px] sm:text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                />
                <input
                  type="tel"
                  placeholder="WhatsApp (Ex: 22 99999-9999)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!settings.isOpen}
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-[16px] sm:text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-black text-stone-800 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-600" /> Endereço de
                Entrega
              </h3>
              <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <button
                  onClick={handleGetLocation}
                  disabled={!settings.isOpen || isFetchingLocation}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl border border-orange-200 text-xs font-black transition-all"
                >
                  {isFetchingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  {isFetchingLocation
                    ? "Buscando localização..."
                    : "USAR MEU GPS"}
                </button>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Logradouro/Rua"
                    value={addressData.logradouro}
                    onChange={(e) =>
                      setAddressData({
                        ...addressData,
                        logradouro: e.target.value,
                      })
                    }
                    disabled={!settings.isOpen}
                    className="flex-1 border-b py-2 text-[16px] sm:text-sm outline-none focus:border-orange-600 bg-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Nº"
                    value={addressData.numero}
                    onChange={(e) =>
                      setAddressData({ ...addressData, numero: e.target.value })
                    }
                    disabled={!settings.isOpen}
                    className="w-16 border-b py-2 text-[16px] sm:text-sm outline-none focus:border-orange-600 text-center bg-transparent"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Bairro (Para frete)"
                    value={addressData.bairro}
                    onChange={(e) =>
                      setAddressData({ ...addressData, bairro: e.target.value })
                    }
                    disabled={!settings.isOpen}
                    className="flex-1 border-b py-2 text-[16px] sm:text-sm outline-none focus:border-orange-600 font-bold bg-transparent"
                  />
                  {isValidatingArea && (
                    <Loader2 className="w-4 h-4 animate-spin text-orange-600 shrink-0" />
                  )}
                </div>

                {bairroStatus?.valido === false && (
                  <p className="text-[11px] font-bold text-red-600 uppercase mt-1 leading-tight bg-red-50 p-2 rounded-md">
                    {bairroStatus.mensagem}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-black text-stone-800 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange-600" /> Observação{" "}
                <span className="font-normal text-stone-400 text-xs">
                  (Opcional)
                </span>
              </h3>
              <textarea
                placeholder="Ex: Troco para R$50, tirar cebola..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                disabled={!settings.isOpen}
                rows={2}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-[16px] sm:text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white resize-none"
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-black text-stone-800 text-sm flex items-center gap-2">
                <Banknote className="w-4 h-4 text-orange-600" /> Forma de
                Pagamento
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPayment("pix")}
                  disabled={!settings.isOpen}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${payment === "pix" ? "border-orange-600 bg-orange-50 text-orange-700" : "border-stone-200 text-stone-400 bg-white"}`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-[10px] font-black">PIX</span>
                </button>
                <button
                  onClick={() => setPayment("dinheiro")}
                  disabled={!settings.isOpen}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${payment === "dinheiro" ? "border-orange-600 bg-orange-50 text-orange-700" : "border-stone-200 text-stone-400 bg-white"}`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-[10px] font-black">DINHEIRO</span>
                </button>
                {settings.mercadoPagoAtivo && (
                  <button
                    onClick={() => setPayment("cartao")}
                    disabled={!settings.isOpen}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${payment === "cartao" ? "border-orange-600 bg-orange-50 text-orange-700" : "border-stone-200 text-stone-400 bg-white"}`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-[10px] font-black text-center leading-tight">
                      CARTÃO
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* RESUMO DOS VALORES ANTES DE FINALIZAR */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2 text-[12px] font-bold text-stone-500 uppercase">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              {taxaEmbalagem > 0 && (
                <div className="flex justify-between">
                  <span>Embalagem:</span>
                  <span>{formatCurrency(taxaEmbalagem)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Entrega:</span>
                <span>
                  {isValidatingArea
                    ? "Calculando..."
                    : formatCurrency(taxaEntrega)}
                </span>
              </div>
              {taxaCartao > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Taxa Cartão:</span>
                  <span>{formatCurrency(taxaCartao)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-stone-100">
                <span className="text-sm font-black text-stone-800">
                  Total a Pagar
                </span>
                <span className="text-2xl font-black text-orange-600">
                  {formatCurrency(totalFinal)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER FIXO (AÇÃO PRINCIPAL) */}
      {!isCartEmpty && (
        <div className="p-4 bg-white border-t border-stone-200 shrink-0 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] pb-safe">
          {step === 1 ? (
            <>
              <div className="flex justify-between items-center mb-3 px-1">
                <span className="text-sm font-bold text-stone-500 uppercase">
                  Subtotal
                </span>
                <span className="text-2xl font-black text-stone-800">
                  {formatCurrency(cartSubtotal)}
                </span>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!settings.isOpen}
                className="w-full py-4 rounded-2xl text-white font-black text-[15px] bg-orange-600 hover:bg-orange-700 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
              >
                Avançar para Entrega <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              {missingFields.length > 0 && settings.isOpen && (
                <div className="text-center animate-in fade-in zoom-in mb-3">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-wider bg-red-50 py-2 px-3 rounded-xl border border-red-100 inline-block">
                    ⚠️ Falta preencher: {missingFields.join(", ")}
                  </p>
                </div>
              )}
              <button
                onClick={handleFinalize}
                disabled={isBlockSubmit}
                className="w-full py-4 rounded-2xl text-white font-black text-[15px] bg-green-600 hover:bg-green-700 disabled:bg-stone-300 disabled:text-stone-500 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShoppingBag className="w-5 h-5" />
                )}
                {isProcessing ? "PROCESSANDO..." : "FINALIZAR PEDIDO"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
