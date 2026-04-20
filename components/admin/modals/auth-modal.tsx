import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { verifyFinanceiroPassword } from "@/lib/actions";
import { toast } from "sonner";

interface AuthModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export function AuthModal({ onSuccess, onClose }: AuthModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isValid = await verifyFinanceiroPassword(password);
      if (isValid) {
        onSuccess();
        onClose();
      } else {
        toast.error("Senha incorreta.");
      }
    } catch {
      toast.error("Erro ao verificar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Acesso Restrito</CardTitle>
              <Button type="button" variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>Digite a senha financeira para ver os valores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              type="password" 
              placeholder="Senha" 
              autoFocus 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verificando..." : "Desbloquear"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}