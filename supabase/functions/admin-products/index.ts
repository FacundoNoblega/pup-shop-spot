import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pin, action, product } = await req.json();

    // Validate PIN server-side
    const adminPin = Deno.env.get("ADMIN_PIN");
    if (!adminPin || pin !== adminPin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate action
    if (!["insert", "update", "delete"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result;

    if (action === "insert") {
      if (!product?.nombre || !product?.categoria) {
        return new Response(
          JSON.stringify({ error: "nombre and categoria are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { data, error } = await supabaseAdmin.from("products").insert({
        nombre: String(product.nombre).slice(0, 200),
        marca: product.marca ? String(product.marca).slice(0, 200) : null,
        categoria: String(product.categoria).slice(0, 100),
        descripcion: product.descripcion ? String(product.descripcion).slice(0, 2000) : null,
        imagen_url: product.imagen_url ? String(product.imagen_url).slice(0, 500) : null,
        variaciones: product.variaciones ?? [],
      }).select().single();
      result = { data, error };
    } else if (action === "update") {
      if (!product?.id) {
        return new Response(
          JSON.stringify({ error: "Product id is required for update" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { data, error } = await supabaseAdmin.from("products").update({
        nombre: String(product.nombre).slice(0, 200),
        marca: product.marca ? String(product.marca).slice(0, 200) : null,
        categoria: String(product.categoria).slice(0, 100),
        descripcion: product.descripcion ? String(product.descripcion).slice(0, 2000) : null,
        imagen_url: product.imagen_url ? String(product.imagen_url).slice(0, 500) : null,
        variaciones: product.variaciones ?? [],
      }).eq("id", product.id).select().single();
      result = { data, error };
    } else if (action === "delete") {
      if (!product?.id) {
        return new Response(
          JSON.stringify({ error: "Product id is required for delete" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { error } = await supabaseAdmin.from("products").delete().eq("id", product.id);
      result = { data: null, error };
    }

    if (result?.error) {
      return new Response(
        JSON.stringify({ error: "Database operation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result?.data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
