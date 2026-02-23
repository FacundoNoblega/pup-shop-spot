import { useState } from "react";
import type { Product, Variation } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES } from "@/types/product";
import { Plus, Trash2, Upload, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  product?: Product | null;
  adminPin: string;
  onSaved: () => void;
  onCancel: () => void;
}

const emptyVariation = (): Variation => ({ key: "", value: "", precio: 0, stock: 0 });

export function ProductForm({ product, adminPin, onSaved, onCancel }: Props) {
  const isEditing = !!product;

  const [nombre, setNombre] = useState(product?.nombre ?? "");
  const [marca, setMarca] = useState(product?.marca ?? "");
  const [categoria, setCategoria] = useState(product?.categoria ?? CATEGORIES[0]);
  const [descripcion, setDescripcion] = useState(product?.descripcion ?? "");
  const [imagenUrl, setImagenUrl] = useState(product?.imagen_url ?? "");
  const [variaciones, setVariaciones] = useState<Variation[]>(
    product?.variaciones?.length ? product.variaciones : [emptyVariation()]
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast({ title: "Error al subir imagen", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    setImagenUrl(urlData.publicUrl);
    setUploading(false);
    toast({ title: "Imagen subida ✓" });
  };

  const updateVariation = (index: number, field: keyof Variation, value: string | number) => {
    setVariaciones((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const addVariation = () => setVariaciones((prev) => [...prev, emptyVariation()]);
  const removeVariation = (index: number) =>
    setVariaciones((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !categoria) {
      toast({ title: "Nombre y categoría son obligatorios", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      nombre: nombre.trim(),
      marca: marca.trim() || null,
      categoria,
      descripcion: descripcion.trim() || null,
      imagen_url: imagenUrl || null,
      variaciones: JSON.parse(JSON.stringify(variaciones.filter((v) => v.value.trim()))),
    };

    const action = isEditing ? "update" : "insert";
    const productData = isEditing ? { ...payload, id: product!.id } : payload;

    const { data, error } = await supabase.functions.invoke("admin-products", {
      body: { pin: adminPin, action, product: productData },
    });

    setSaving(false);
    if (error || !data?.success) {
      toast({ title: "Error al guardar", description: "Verificá el PIN o intentá de nuevo", variant: "destructive" });
    } else {
      toast({ title: isEditing ? "Producto actualizado ✓" : "Producto creado ✓" });
      onSaved();
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {isEditing ? "Editar producto" : "Nuevo producto"}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input value={marca} onChange={(e) => setMarca(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Imagen</Label>
              <div className="flex gap-2">
                <label className="flex-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary border border-border text-sm cursor-pointer hover:bg-secondary/80 transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Subiendo..." : imagenUrl ? "Cambiar" : "Subir foto"}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                {imagenUrl && (
                  <img src={imagenUrl} alt="" className="w-10 h-10 rounded-md object-cover border border-border" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="bg-secondary border-border" rows={2} />
          </div>

          {/* Variaciones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Variaciones</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariation}>
                <Plus className="w-3 h-3 mr-1" /> Agregar
              </Button>
            </div>
            {variaciones.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <Input placeholder="Ej: Bolsa" value={v.key} onChange={(e) => updateVariation(i, "key", e.target.value)} className="bg-secondary border-border text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Valor</Label>
                  <Input placeholder="Ej: 3kg" value={v.value} onChange={(e) => updateVariation(i, "value", e.target.value)} className="bg-secondary border-border text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Precio</Label>
                  <Input type="number" value={v.precio} onChange={(e) => updateVariation(i, "precio", Number(e.target.value))} className="bg-secondary border-border text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Stock</Label>
                  <Input type="number" value={v.stock} onChange={(e) => updateVariation(i, "stock", Number(e.target.value))} className="bg-secondary border-border text-sm" />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeVariation(i)} className="text-destructive hover:text-destructive" disabled={variaciones.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? "Guardar cambios" : "Crear producto"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
