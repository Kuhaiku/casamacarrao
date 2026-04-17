"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

export type PrintConfig = {
  paperWidth: "58mm" | "80mm";
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  fontSize: number;
  showCustomer: boolean;
  showPaymentMethod: boolean;
  showGeneralObservation: boolean;
  showServiceFee: boolean;
};

export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  paperWidth: "80mm",
  marginTop: 4,
  marginRight: 4,
  marginBottom: 4,
  marginLeft: 4,
  fontSize: 12,
  showCustomer: true,
  showPaymentMethod: true,
  showGeneralObservation: true,
  showServiceFee: true,
};

type Props = {
  open: boolean;
  onClose: () => void;
  value: PrintConfig;
  onChange: (value: PrintConfig) => void;
};

export function PrintSettingsModal({
  open,
  onClose,
  value,
  onChange,
}: Props) {
  if (!open) return null;

  const update = <K extends keyof PrintConfig>(key: K, val: PrintConfig[K]) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-xl shadow-2xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Configurar Impressão</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label>Largura do Papel</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={value.paperWidth === "58mm" ? "default" : "outline"}
                onClick={() => update("paperWidth", "58mm")}
              >
                58mm
              </Button>
              <Button
                type="button"
                variant={value.paperWidth === "80mm" ? "default" : "outline"}
                onClick={() => update("paperWidth", "80mm")}
              >
                80mm
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Margem Topo</Label>
              <Input
                type="number"
                value={value.marginTop}
                onChange={(e) => update("marginTop", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Margem Direita</Label>
              <Input
                type="number"
                value={value.marginRight}
                onChange={(e) => update("marginRight", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Margem Base</Label>
              <Input
                type="number"
                value={value.marginBottom}
                onChange={(e) => update("marginBottom", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Margem Esquerda</Label>
              <Input
                type="number"
                value={value.marginLeft}
                onChange={(e) => update("marginLeft", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tamanho da Fonte</Label>
            <Input
              type="number"
              value={value.fontSize}
              onChange={(e) => update("fontSize", Number(e.target.value))}
            />
          </div>

          <div className="space-y-4 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <Label>Mostrar cliente</Label>
              <Switch
                checked={value.showCustomer}
                onCheckedChange={(checked) => update("showCustomer", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar forma de pagamento</Label>
              <Switch
                checked={value.showPaymentMethod}
                onCheckedChange={(checked) =>
                  update("showPaymentMethod", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar observação geral</Label>
              <Switch
                checked={value.showGeneralObservation}
                onCheckedChange={(checked) =>
                  update("showGeneralObservation", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar 10% serviço</Label>
              <Switch
                checked={value.showServiceFee}
                onCheckedChange={(checked) => update("showServiceFee", checked)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}