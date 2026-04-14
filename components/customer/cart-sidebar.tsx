// components/customer/cart-sidebar.tsx
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
} from "lucide-react";
import { validateBairro } from "@/lib/actions";
import { createPaymentPreference } from "@/lib/mercadopago-actions";
import { useToast } from "@/hooks/use-toast";

export function CartSidebar(props: any) {
  const { toast } = useToast();
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

  // Cálculos de Taxas (Corrigido para evitar concatenação de string)
  const taxaEmbalagem = useMemo(() => {
    const taxaGlobal = Number(settings.taxaEmbalagemGlobal) || 2.00;
    
    const taxaSelfService = cartSelfService.reduce((acc: number, item: any) => {
      const size = sizes.find((s: any) => s.id === item.sizeId);
      // Força a conversão para número
      const fee = size?.taxaEmbalagem ? Number(size.taxaEmbalagem) : taxaGlobal;
      return acc + fee;
    }, 0);

    const taxaAvulsos = cartAvulsos.reduce((acc: number, item: any) => {
      const prod = products.find((p: any) => p.id === item.productId);
      if (!prod) return acc;
      
      let itemFee = 0;
      if (prod.tipoEmbalagem === 'padrao') {
        itemFee = taxaGlobal;
      } else if (prod.tipoEmbalagem === 'personalizada') {
        itemFee = Number(prod.taxaEmbalagem) || 0;
      } else if (prod.tem_embalagem) { 
        itemFee = taxaGlobal;
      }
      
      return acc + (itemFee * item.quantity);
    }, 0);
    
    return taxaSelfService + taxaAvulsos;
  }, [cartSelfService, cartAvulsos, products, settings, sizes]);

  const taxaEntrega = bairroStatus?.valido ? bairroStatus.taxa_entrega : 0;

  const taxaCartao = useMemo(() => {
    if (payment !== "cartao") return 0;
    const base = cartSubtotal + taxaEmbalagem + taxaEntrega;
    return (
      base * ((settings.taxaCartaoPercentual || 0) / 100) +
      (settings.taxaCartaoFixa || 0)
    );
  }, [payment, cartSubtotal, taxaEmbalagem, taxaEntrega, settings]);

  const totalFinal = cartSubtotal + taxaEmbalagem + taxaEntrega + taxaCartao;

  const isAddressInvalid = !bairroStatus || !bairroStatus.valido;
  const isBlockSubmit =
    settings.isOpen === false ||
    isCartEmpty ||
    isAddressInvalid ||
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
    if (!addressData.logradouro || !addressData.numero || !addressData.bairro) {
      toast({
        title: "Atenção",
        description: "Preencha Rua, Bairro e Número.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const finalAddress = `${addressData.logradouro}, Nº ${addressData.numero} - ${addressData.bairro}, ${addressData.cidade}`;
    const trackingId = crypto.randomUUID();

    // Declarando como any para ignorar completamente erros de inferência restrita do TypeScript
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
      const res = await createPaymentPreference(orderData, totalFinal);
      if (res.success && res.init_point) {
        window.location.href = res.init_point;
        return;
      }
    }

    setIsProcessing(false);
    router.push(`/pedido/${trackingId}`);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-orange-600" /> Sua Sacola
        </h2>
        <button
          onClick={() => setIsMobileCartOpen(false)}
          className="lg:hidden text-stone-500 font-medium p-2 text-xs bg-stone-200 rounded-lg"
        >
          Fechar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isCartEmpty ? (
          <div className="text-center py-10 text-stone-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm italic">Adicione itens para continuar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cartSelfService.map((item: any) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-stone-50 p-2 rounded-lg border border-stone-100"
              >
                <span className="text-xs font-bold text-stone-700">
                  1x Macarrão{" "}
                  {sizes.find((s: any) => s.id === item.sizeId)?.name}
                </span>
                <button
                  onClick={() => handleRemoveSelfService(item.id)}
                  className="text-stone-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {cartAvulsos.map((item: any) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-stone-50 p-2 rounded-lg border border-stone-100"
              >
                <span className="text-xs font-bold text-stone-700">
                  {item.quantity}x {item.product.name}
                </span>
                <button
                  onClick={() => handleRemoveAvulso(item.id)}
                  className="text-stone-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-4 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Seu Nome"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={!settings.isOpen}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
          />
          <input
            type="tel"
            placeholder="WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!settings.isOpen}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
          />
        </div>

        <div className="space-y-2 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
          <button
            onClick={handleGetLocation}
            disabled={!settings.isOpen || isFetchingLocation}
            className="w-full flex items-center justify-center gap-2 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg border border-orange-200 text-xs font-black transition-all mb-2"
          >
            {isFetchingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            {isFetchingLocation ? "Buscando endereço..." : "PREENCHER VIA GPS"}
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome da Rua"
              value={addressData.logradouro}
              onChange={(e) =>
                setAddressData({ ...addressData, logradouro: e.target.value })
              }
              disabled={!settings.isOpen}
              className="flex-1 border-b py-1.5 text-sm outline-none focus:border-orange-600"
            />
            <input
              type="text"
              placeholder="Nº"
              value={addressData.numero}
              onChange={(e) =>
                setAddressData({ ...addressData, numero: e.target.value })
              }
              disabled={!settings.isOpen}
              className="w-14 border-b py-1.5 text-sm outline-none focus:border-orange-600 text-center"
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
              className="flex-1 border-b py-1.5 text-sm outline-none focus:border-orange-600 font-bold"
            />
            {isValidatingArea && (
              <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
            )}
          </div>

          {bairroStatus?.valido === false && (
            <p className="text-[10px] font-bold text-red-600 uppercase mt-1 leading-tight">
              {bairroStatus.mensagem}
            </p>
          )}
        </div>

        <div className="text-[11px] font-bold text-stone-500 uppercase space-y-1 bg-white p-2 rounded-lg border border-stone-100">
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
              {isValidatingArea ? "Calculando..." : formatCurrency(taxaEntrega)}
            </span>
          </div>
          {taxaCartao > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Taxa Cartão:</span>
              <span>{formatCurrency(taxaCartao)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-stone-500 uppercase">
            Total do Pedido
          </span>
          <span className="text-2xl font-black text-orange-700">
            {formatCurrency(totalFinal)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setPayment("pix")}
            disabled={!settings.isOpen}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${payment === "pix" ? "border-orange-600 bg-orange-50 text-orange-700" : "border-stone-200 text-stone-400"}`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-[9px] font-black">PIX</span>
          </button>
          <button
            onClick={() => setPayment("dinheiro")}
            disabled={!settings.isOpen}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${payment === "dinheiro" ? "border-orange-600 bg-orange-50 text-orange-700" : "border-stone-200 text-stone-400"}`}
          >
            <Banknote className="w-4 h-4" />
            <span className="text-[9px] font-black">DINHEIRO</span>
          </button>
          {settings.mercadoPagoAtivo && (
            <button
              onClick={() => setPayment("cartao")}
              disabled={!settings.isOpen}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${payment === "cartao" ? "border-orange-600 bg-orange-50 text-orange-700" : "border-stone-200 text-stone-400"}`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-[9px] font-black">CARTÃO</span>
            </button>
          )}
        </div>

        <button
          onClick={handleFinalize}
          disabled={isBlockSubmit || isProcessing}
          className="w-full py-4 rounded-2xl text-white font-black text-sm bg-green-600 hover:bg-green-700 disabled:bg-stone-300 disabled:text-stone-500 transition-all flex justify-center items-center gap-2 shadow-lg active:scale-95"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ShoppingBag className="w-5 h-5" />
          )}
          {isProcessing ? "PROCESSANDO..." : "FINALIZAR PEDIDO"}
        </button>
      </div>
    </div>
  );
}
