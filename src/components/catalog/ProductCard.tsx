import type { Product } from "@/types/product";
import { getMinPrice, getTotalStock } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const minPrice = getMinPrice(product.variaciones);
  const totalStock = getTotalStock(product.variaciones);
  const outOfStock = totalStock === 0;

  return (
    <Card className="group overflow-hidden bg-card border-border hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {product.imagen_url ? (
          <img
            src={product.imagen_url}
            alt={product.nombre}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground/40" />
          </div>
        )}
        <Badge
          className="absolute top-3 left-3 bg-secondary/90 text-secondary-foreground backdrop-blur-sm border-0 text-xs"
        >
          {product.categoria}
        </Badge>
        {outOfStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-sm">
            <span className="text-sm font-semibold text-destructive">Sin stock</span>
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        {product.marca && (
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {product.marca}
          </p>
        )}
        <h3 className="font-semibold text-foreground leading-tight line-clamp-2">
          {product.nombre}
        </h3>
        {product.descripcion && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.descripcion}
          </p>
        )}
        {minPrice !== null && (
          <p className="text-lg font-bold text-primary">
            Desde ${minPrice.toLocaleString("es-AR")}
          </p>
        )}
        {product.variaciones && product.variaciones.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {product.variaciones.map((v, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
              >
                {v.value}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
