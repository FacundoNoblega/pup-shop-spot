import { useState, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { PinGate } from "@/components/admin/PinGate";
import { ProductTable } from "@/components/admin/ProductTable";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { Dog, Plus, LogOut, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import type { Product } from "@/types/product";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Admin = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("admin_auth") === "true");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const { data: products, isLoading } = useProducts();
  const queryClient = useQueryClient();

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    setEditing(null);
    setCreating(false);
  }, [queryClient]);

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("products").delete().eq("id", deleting.id);
    if (error) {
      toast({ title: "Error al eliminar", variant: "destructive" });
    } else {
      toast({ title: "Producto eliminado ✓" });
      refresh();
    }
    setDeleting(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setAuthed(false);
  };

  if (!authed) return <PinGate onSuccess={() => setAuthed(true)} />;

  const showForm = creating || editing;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Dog className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold">Panel Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            {!showForm && (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="w-4 h-4 mr-1" /> Nuevo
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {showForm ? (
          <ProductForm
            product={editing}
            onSaved={refresh}
            onCancel={() => { setEditing(null); setCreating(false); }}
          />
        ) : isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Cargando productos...</div>
        ) : (
          <ProductTable
            products={products ?? []}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        )}
      </main>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar "{deleting?.nombre}"?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
