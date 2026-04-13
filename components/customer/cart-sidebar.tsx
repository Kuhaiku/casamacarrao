import { ShoppingBag, Trash2, MapPin, Star, Smartphone, Banknote } from "lucide-react";

const PAY_META = {
  pix: { label: "PIX", icon: Smartphone },
  dinheiro: { label: "Dinheiro", icon: Banknote },
};

export function CartSidebar(props: any) {
  const { 
    cartTotal, totalItemsCount, cartSelfService, cartAvulsos, isCartEmpty,
    customerName, phone, address, addressNumber, observation, payment,
    setCustomerName, setPhone, setAddress, setAddressNumber, setObservation, setPayment,
    handleGetLocation, isFetchingLocation, handleFinalize, handleRemoveSelfService, handleRemoveAvulso,
    sizes, settings, menuItems, formatCurrency, setIsMobileCartOpen
  } = props;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-stone-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-600" /> Sua Sacola
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">{totalItemsCount} item(s)</p>
        </div>
        <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden text-stone-500 font-medium p-2 text-sm bg-stone-200 rounded-lg">
          Voltar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {isCartEmpty ? (
          <div className="text-center py-10 text-stone-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sua sacola está vazia.</p>
          </div>
        ) : (
          <>
            {cartSelfService.map((item: any) => {
              const size = sizes.find((s: any) => s.id === item.sizeId);
              let sub = size?.price || 0;
              if (size) {
                if (!size.strictMaxIngredients) sub += Math.max(0, item.ingredients.length - size.maxIngredients) * (settings.extraIngredientPrice || 0);
                if (!size.strictMaxSauces) sub += Math.max(0, item.sauces.length - size.maxSauces) * (settings.extraSaucePrice || 0);
                if (!size.strictMaxPastas && item.pastas?.length) sub += Math.max(0, item.pastas.length - size.maxPastas) * (settings.extraPastaPrice || 0);
                item.extras?.forEach((extId: string) => {
                  const extraItem = menuItems.find((m: any) => m.id === extId);
                  if (extraItem && extraItem.price) sub += extraItem.price;
                });
                if (item.extraCheese) sub += 3.0;
              }
              return (
                <div key={item.id} className="flex justify-between items-start border-b border-stone-100 pb-3">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-stone-800 text-sm leading-tight">Macarrão {size?.name}</p>
                    <p className="text-[11px] sm:text-xs text-stone-500 mt-1 leading-snug">
                      {menuItems.find((m: any) => m.id === item.pastaId)?.name} • {item.sauces?.map((sId: string) => menuItems.find((m: any) => m.id === sId)?.name).join(", ")}
                    </p>
                    {item.extras?.length > 0 && (
                      <p className="text-[11px] text-amber-600 font-bold mt-0.5 flex items-center gap-1">
                        <Star className="w-3 h-3" /> {item.extras.map((eId: string) => menuItems.find((m:any) => m.id === eId)?.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="font-semibold text-stone-700 text-sm">{formatCurrency(sub)}</span>
                    <button onClick={() => handleRemoveSelfService(item.id)} className="text-stone-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
            {cartAvulsos.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center border-b border-stone-100 pb-3">
                <div className="flex-1 pr-2">
                  <p className="font-bold text-stone-800 text-sm leading-tight">{item.quantity}x {item.product.name}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="font-semibold text-stone-700 text-sm">{formatCurrency(item.product.price * item.quantity)}</span>
                  <button onClick={() => handleRemoveAvulso(item.id)} className="text-stone-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 space-y-3 sm:space-y-4 shrink-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-bold text-stone-600">Total a Pagar</span>
          <span className={`text-xl sm:text-2xl font-black ${isCartEmpty ? "text-stone-400" : "text-orange-700"}`}>
            {formatCurrency(cartTotal)}
          </span>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <input type="text" placeholder="Seu Nome" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={isCartEmpty} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none disabled:bg-stone-100" />
          <input type="tel" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isCartEmpty} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none disabled:bg-stone-100" />
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <input type="text" placeholder="Rua, bairro..." value={address} onChange={(e) => setAddress(e.target.value)} disabled={isCartEmpty} className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none disabled:bg-stone-100" />
              <input type="text" placeholder="Nº / Lote" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} disabled={isCartEmpty} className="w-24 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none disabled:bg-stone-100" />
            </div>
            <button onClick={handleGetLocation} disabled={isCartEmpty || isFetchingLocation} className="w-full flex items-center justify-center gap-1.5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
              <MapPin className="w-3.5 h-3.5 text-orange-600" /> {isFetchingLocation ? "Buscando localização..." : "Usar minha localização atual"}
            </button>
          </div>
          <textarea placeholder="Observação (Ex: Troco para R$50...)" value={observation} onChange={(e) => setObservation(e.target.value)} disabled={isCartEmpty} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none disabled:bg-stone-100 resize-none h-14" />
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            {Object.entries(PAY_META).map(([key, { label, icon: Icon }]) => (
              <button key={key} onClick={() => setPayment(key as "pix" | "dinheiro")} disabled={isCartEmpty} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all disabled:opacity-50 ${payment === key && !isCartEmpty ? "border-orange-600 bg-orange-50 text-orange-700" : "border-stone-200 text-stone-500"}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase">{label}</span>
              </button>
            ))}
          </div>
          <button onClick={handleFinalize} disabled={isCartEmpty || !customerName.trim() || !phone.trim() || !address.trim() || !addressNumber.trim()} className="w-full py-3 sm:py-3.5 mt-2 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 disabled:bg-stone-300 transition-colors">
            Confirmar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}