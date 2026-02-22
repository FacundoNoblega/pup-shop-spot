import type { Product } from "@/types/product";
import { getMinPrice } from "@/hooks/useProducts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Package } from "lucide-react";

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductTable({ products, onEdit, onDelete }: Props) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <Package className="w-12 h-12 mx-auto text-muted-foreground/40" />
        <p className="text-muted-foreground">No hay productos aún. ¡Creá el primero!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="w-12">Img</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden sm:table-cell">Categoría</TableHead>
            <TableHead className="hidden md:table-cell">Variaciones</TableHead>
            <TableHead className="hidden sm:table-cell">Precio</TableHead>
            <TableHead className="w-24 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const price = getMinPrice(p.variaciones);
            return (
              <TableRow key={p.id} className="border-border">
                <TableCell>
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt="" className="w-10 h-10 rounded-md object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{p.nombre}</p>
                    {p.marca && <p className="text-xs text-muted-foreground">{p.marca}</p>}
                    <Badge className="sm:hidden mt-1 text-xs" variant="secondary">{p.categoria}</Badge>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary">{p.categoria}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {p.variaciones?.length ?? 0}
                </TableCell>
                <TableCell className="hidden sm:table-cell font-medium text-primary">
                  {price !== null ? `$${price.toLocaleString("es-AR")}` : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(p)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(p)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
