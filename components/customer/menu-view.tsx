import { ArrowRight, Plus } from "lucide-react";

export function MenuView({ itemsBySection, formatCurrency, setView, handleAddAvulso }: any) {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section>
        <div className="mb-2 sm:mb-3 mt-2 lg:mt-0">
          <h2 className="text-base sm:text-lg font-bold text-stone-800">Self-Service</h2>
          <p className="text-[11px] sm:text-xs text-stone-500">Monte o macarrão com seus ingredientes favoritos.</p>
        </div>
        <button
          onClick={() => setView("builder")}
          className="w-full text-left bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg hover:scale-[1.01] transition-transform"
        >
          <div className="flex justify-between items-center">
            <div className="pr-2">
              <h3 className="text-xl sm:text-2xl font-black mb-0.5 sm:mb-1">Montar Macarrão</h3>
              <p className="text-orange-200 text-xs sm:text-sm font-medium leading-snug">Você escolhe tudo do seu jeito</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0">
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </button>
      </section>

      {Object.entries(itemsBySection).map(([category, prods]: any) => (
        <section key={category}>
          <div className="mb-2 sm:mb-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-800 capitalize">{category}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prods.map((produto: any) => (
              <div
                key={produto.id}
                className="bg-white border border-stone-200 rounded-xl p-3 sm:p-4 flex items-center justify-between hover:border-orange-300 transition-colors"
              >
                <div className="flex-1 pr-3">
                  <h4 className="font-bold text-stone-800 text-sm leading-tight">{produto.name}</h4>
                  <p className="text-orange-700 font-bold mt-1 text-sm">{formatCurrency(produto.price)}</p>
                </div>
                <button
                  onClick={() => handleAddAvulso(produto)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}