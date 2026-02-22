import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Variation } from "@/types/product";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        ...row,
        variaciones: Array.isArray(row.variaciones)
          ? (row.variaciones as unknown as Variation[])
          : [],
      }));
    },
  });
}

export function getMinPrice(variaciones: Variation[] | null): number | null {
  if (!variaciones || variaciones.length === 0) return null;
  return Math.min(...variaciones.map((v) => v.precio));
}

export function getTotalStock(variaciones: Variation[] | null): number {
  if (!variaciones || variaciones.length === 0) return 0;
  return variaciones.reduce((sum, v) => sum + (v.stock ?? 0), 0);
}
