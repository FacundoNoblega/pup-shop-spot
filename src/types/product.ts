export interface Variation {
  key: string;
  value: string;
  precio: number;
  stock: number;
}

export interface Product {
  id: string;
  nombre: string;
  marca: string | null;
  categoria: string;
  descripcion: string | null;
  imagen_url: string | null;
  variaciones: Variation[] | null;
  created_at: string;
}

export const CATEGORIES = ["Alimentos", "Accesorios", "Higiene", "Venenos"] as const;
export type Category = typeof CATEGORIES[number];
