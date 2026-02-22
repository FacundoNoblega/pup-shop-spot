import { useState, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";
import { SearchBar } from "@/components/catalog/SearchBar";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Dog, PackageOpen } from "lucide-react";
import type { Category } from "@/types/product";

const Index = () => {
  const { data: products, isLoading, error } = useProducts();
  const [category, setCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      if (category && p.categoria !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.nombre.toLowerCase().includes(q) ||
          p.marca?.toLowerCase().includes(q) ||
          p.descripcion?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, category, search]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Dog className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            La Perri<span className="text-primary">cueva</span>
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <section className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">
            Todo para tu <span className="text-primary">mejor amigo</span> 🐾
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Alimentos, accesorios y más para el bienestar de tu mascota.
          </p>
        </section>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <CategoryFilter selected={category} onSelect={setCategory} />
          <div className="sm:ml-auto w-full sm:w-auto">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">
            Error al cargar productos. Intentá de nuevo más tarde.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <PackageOpen className="w-16 h-16 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {products?.length === 0
                ? "Aún no hay productos cargados."
                : "No se encontraron productos con esos filtros."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} La Perricueva — Hecho con 🐾
        </div>
      </footer>
    </div>
  );
};

export default Index;
