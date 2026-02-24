import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_CATEGORIES = ["Alimentos", "Accesorios", "Higiene", "Venenos"];
const MAX_VARIACIONES = 20;

const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(ip);
  if (!record || now > record.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  record.count++;
  return record.count > MAX_REQUESTS;
}

function validateProduct(product: any, action: string): string | null {
  if (action !== "delete") {
    if (!product?.nombre || typeof product.nombre !== "string" || product.nombre.trim().length === 0) {
      return "El nombre es requerido y debe ser texto válido";
    }
    if (product.nombre.length > 200) {
      return "El nombre no puede exceder 200 caracteres";
    }
    if (!product?.categoria || !VALID_CATEGORIES.includes(product.categoria)) {
      return `Categoría inválida. Debe ser: ${VALID_CATEGORIES.join(", ")}`;
    }
    if (product.marca && (typeof product.marca !== "string" || product.marca.length > 200)) {
      return "Marca inválida o demasiado larga";
    }
    if (product.descripcion && (typeof product.descripcion !== "string" || product.descripcion.length > 2000)) {
      return "Descripción inválida o demasiado larga";
    }
    if (product.imagen_url && (typeof product.imagen_url !== "string" || product.imagen_url.length > 500)) {
      return "URL de imagen inválida";
    }
    if (product.variaciones) {
      if (!Array.isArray(product.variaciones)) {
        return "Variaciones debe ser un array";
      }
      if (product.variaciones.length > MAX_VARIACIONES) {
        return `No se permiten más de ${MAX_VARIACIONES} variaciones`;
      }
      for (const v of product.variaciones) {
        if (!v.value || typeof v.value !== "string") {
          return "Cada variación debe tener un valor de texto";
        }
        if (typeof v.precio !== "number" || v.precio < 0) {
          return "El precio debe ser un número positivo";
        }
        if (typeof v.stock !== "number" || v.stock < 0) {
          return "El stock debe ser un número positivo";
        }
      }
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Demasiadas peticiones. Intenta de nuevo más tarde." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { pin, action, product } = await req.json();

    const adminPin = Deno.env.get("ADMIN_PIN");
    if (!adminPin) {
      console.error("ADMIN_PIN no configurado en variables de entorno");
      return new Response(
        JSON.stringify({ error: "Error de configuración del servidor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pin || typeof pin !== "string" || pin !== adminPin) {
      console.warn(`Intento de acceso no autorizado desde IP: ${ip}`);
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!action || !["insert", "update", "delete"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Acción inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationError = validateProduct(product, action);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    let result;

    if (action === "insert") {
      const { data, error } = await supabaseAdmin.from("products").insert({
        nombre: product.nombre.trim().slice(0, 200),
        marca: product.marca ? product.marca.trim().slice(0, 200) : null,
        categoria: product.categoria,
        descripcion: product.descripcion ? product.descripcion.trim().slice(0, 2000) : null,
        imagen_url: product.imagen_url ? product.imagen_url.trim().slice(0, 500) : null,
        variaciones: product.variaciones ?? [],
      }).select().single();

      if (error) {
        console.error("Error al insertar producto:", error);
        return new Response(
          JSON.stringify({ error: "Error al crear el producto" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      result = { data, error };

    } else if (action === "update") {
      if (!product?.id || typeof product.id !== "string") {
        return new Response(
          JSON.stringify({ error: "ID de producto requerido para actualizar" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabaseAdmin.from("products").update({
        nombre: product.nombre.trim().slice(0, 200),
        marca: product.marca ? product.marca.trim().slice(0, 200) : null,
        categoria: product.categoria,
        descripcion: product.descripcion ? product.descripcion.trim().slice(0, 2000) : null,
        imagen_url: product.imagen_url ? product.imagen_url.trim().slice(0, 500) : null,
        variaciones: product.variaciones ?? [],
      }).eq("id", product.id).select().single();

      if (error) {
        console.error("Error al actualizar producto:", error);
        return new Response(
          JSON.stringify({ error: "Error al actualizar el producto" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      result = { data, error };

    } else if (action === "delete") {
      if (!product?.id || typeof product.id !== "string") {
        return new Response(
          JSON.stringify({ error: "ID de producto requerido para eliminar" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabaseAdmin.from("products").delete().eq("id", product.id);

      if (error) {
        console.error("Error al eliminar producto:", error);
        return new Response(
          JSON.stringify({ error: "Error al eliminar el producto" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      result = { data: null, error };
    }

    return new Response(
      JSON.stringify({ success: true, data: result?.data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error en admin-products:", error);
    return new Response(
      JSON.stringify({ error: "Error en la solicitud" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
