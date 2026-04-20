import { useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function getOrderType(address: string) {
  if (!address) return "ENTREGA";
  const trimmed = address.trim().toLowerCase();
  return trimmed.startsWith("mesa") || /^\d+$/.test(trimmed) ? "LOCAL" : "ENTREGA";
}

export function useAdminDashboard() {
  const store = useStore();

  // Sincronização
  useEffect(() => {
    store.sync();
    const interval = setInterval(() => store.sync(), 5000);
    return () => clearInterval(interval);
  }, [store.sync]);

  // Piloto Automático (Horários)
  useEffect(() => {
    const checkSchedule = () => {
      if (!store.settings.deliverySchedule) return;

      const now = new Date();
      now.setHours(now.getHours() - 3);
      const day = now.getDay().toString();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const schedule: any = store.settings.deliverySchedule;
      const today = schedule[day];

      let shouldBeOpen = false;
      if (today && today.active && timeStr >= today.start && timeStr <= today.end) {
        shouldBeOpen = true;
      }

      if (store.settings.isOpen !== shouldBeOpen) {
        store.updateSettings({ isOpen: shouldBeOpen });
        toast.info(`Piloto Automático: Loja ${shouldBeOpen ? "ABERTA" : "FECHADA"}.`);
      }
    };

    const interval = setInterval(checkSchedule, 60000);
    const timeout = setTimeout(checkSchedule, 3000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [store.settings.deliverySchedule, store.settings.isOpen, store.updateSettings]);

  // Dados Derivados
  return useMemo(() => {
    const currentShiftOrders = store.orders.filter((o) => !o.isAccounted);
    const currentShiftExpenses = store.expenses.filter((e) => !e.isAccounted);

    const active = currentShiftOrders.filter(
      (o) => o.status !== "cancelado" && !(o.status === "entregue" && o.isPaid)
    );

    return {
      activeLocalOrders: active.filter((o) => getOrderType(o.address) === "LOCAL"),
      activeDeliveryOrders: active.filter((o) => getOrderType(o.address) === "ENTREGA"),
      totalSales: currentShiftOrders
        .filter((o) => o.isPaid && o.status !== "cancelado")
        .reduce((acc, o) => acc + o.total, 0),
      totalExpenses: currentShiftExpenses.reduce((acc, e) => acc + e.amount, 0),
      store
    };
  }, [store.orders, store.expenses, store.settings]);
}