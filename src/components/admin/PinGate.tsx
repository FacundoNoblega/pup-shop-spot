import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dog, Lock, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  onSuccess: (pin: string) => void;
}

export function PinGate({ onSuccess }: Props) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-pin", {
        body: { pin: pin.trim() },
      });

      if (error) throw error;

      if (data?.valid) {
        onSuccess(pin.trim());
      } else {
        toast({ title: "PIN incorrecto", variant: "destructive" });
        setPin("");
      }
    } catch (err) {
      toast({ title: "Error de conexión", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-card border-border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            <Dog className="w-5 h-5 text-primary" />
            Admin — La Perricueva
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Ingresá el PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-lg tracking-widest bg-secondary border-border"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
