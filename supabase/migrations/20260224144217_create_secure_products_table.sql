/*
  # Sistema de Productos con Seguridad Máxima

  1. Tablas Nuevas
    - `products`
      - `id` (uuid, primary key) - Identificador único del producto
      - `nombre` (text, not null) - Nombre del producto (máx 200 chars)
      - `marca` (text, nullable) - Marca del producto (máx 200 chars)
      - `categoria` (text, not null) - Categoría: Alimentos, Accesorios, Higiene, Venenos
      - `descripcion` (text, nullable) - Descripción del producto (máx 2000 chars)
      - `imagen_url` (text, nullable) - URL de la imagen (máx 500 chars)
      - `variaciones` (jsonb, nullable) - Array de variaciones con precio y stock
      - `created_at` (timestamptz) - Fecha de creación
      - `updated_at` (timestamptz) - Fecha de última actualización
      - `created_by` (uuid, nullable) - Usuario que creó el producto (preparado para auth)
      - `updated_by` (uuid, nullable) - Usuario que actualizó (preparado para auth)

  2. Seguridad (RLS)
    - Políticas RESTRICTIVAS por defecto
    - Público: SOLO lectura (SELECT) de productos
    - Admin: Operaciones CUD (Create, Update, Delete) SOLO vía edge functions con PIN
    - Preparado para migrar a autenticación de usuarios

  3. Índices
    - Índice en categoria para filtrado rápido
    - Índice en created_at para ordenamiento
    - Índice GIN en variaciones para búsquedas en JSONB

  4. Validaciones
    - Check constraints en longitud de campos
    - Check en categoría válida
    - Trigger para actualizar updated_at automáticamente

  5. Notas Importantes
    - RLS habilitado INMEDIATAMENTE
    - Sin políticas de escritura directa desde el cliente
    - Todas las operaciones admin van vía edge functions
    - Preparado para agregar auth.uid() en el futuro
*/

-- Crear tabla products con todas las validaciones
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL CHECK (char_length(nombre) <= 200 AND char_length(nombre) > 0),
  marca text CHECK (marca IS NULL OR char_length(marca) <= 200),
  categoria text NOT NULL CHECK (categoria IN ('Alimentos', 'Accesorios', 'Higiene', 'Venenos')),
  descripcion text CHECK (descripcion IS NULL OR char_length(descripcion) <= 2000),
  imagen_url text CHECK (imagen_url IS NULL OR char_length(imagen_url) <= 500),
  variaciones jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid,
  updated_by uuid
);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_variaciones ON products USING GIN (variaciones);
CREATE INDEX IF NOT EXISTS idx_products_nombre ON products(nombre text_pattern_ops);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- HABILITAR RLS INMEDIATAMENTE (SEGURIDAD CRÍTICA)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política 1: Lectura pública para el catálogo
-- Cualquier persona puede ver los productos (anon y authenticated)
CREATE POLICY "Público puede ver catálogo de productos"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Política 2: NINGUNA escritura directa desde el cliente
-- Las operaciones de INSERT, UPDATE, DELETE están BLOQUEADAS
-- Solo se permite vía edge functions con service_role

-- Comentarios explicativos sobre la seguridad
COMMENT ON TABLE products IS 'Tabla de productos con RLS habilitado. Lectura pública, escritura solo vía edge functions autorizadas.';
COMMENT ON COLUMN products.created_by IS 'Usuario creador - NULL por ahora, se usará auth.uid() cuando se implemente autenticación';
COMMENT ON COLUMN products.updated_by IS 'Usuario que modificó - NULL por ahora, se usará auth.uid() cuando se implemente autenticación';
