# Guía de Implementación: Sistema de Autenticación

Esta guía describe exactamente cómo implementar autenticación de usuarios y roles en La Perricueva.

---

## ARQUITECTURA PROPUESTA

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Login     │  │   Register   │  │    Admin     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│           │                │                 │              │
│           └────────────────┴─────────────────┘              │
│                            │                                │
│                    Supabase Client                          │
│                   (auth.signIn, etc.)                       │
└────────────────────────────┬───────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  SUPABASE AUTH  │
                    │   (auth.users)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  user_roles    │  │    products     │  │  audit_logs    │
│  (permisos)    │  │  (con RLS x     │  │  (histórico)   │
│                │  │   rol)          │  │                │
└────────────────┘  └─────────────────┘  └────────────────┘
```

---

## PASO 1: ESTRUCTURA DE BASE DE DATOS

### Migration: `create_auth_system.sql`

```sql
/*
  # Sistema de Autenticación y Roles

  1. Tablas Nuevas
    - user_roles: Asigna roles a usuarios
    - audit_logs: Registro de todas las operaciones

  2. Roles Definidos
    - admin: Control total
    - vendedor: Puede editar productos y stock
    - lector: Solo lectura (igual que público)

  3. Seguridad
    - RLS en todas las tablas
    - Políticas basadas en roles
    - Auditoría automática de cambios
*/

-- Tabla de roles de usuario
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'vendedor', 'lector')),
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índice para búsqueda rápida por rol
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- RLS en user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver roles
CREATE POLICY "Solo admins pueden ver roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Solo admins pueden asignar roles
CREATE POLICY "Solo admins pueden asignar roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Índices para auditoría
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);

-- RLS en audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver logs
CREATE POLICY "Solo admins pueden ver logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Función para logging automático
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, operation, old_data, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, operation, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, operation, new_data, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de auditoría en products
CREATE TRIGGER audit_products_changes
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_product_changes();

-- Actualizar trigger de updated_at para usar auth
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función helper: verificar si usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función helper: verificar si usuario puede editar
CREATE OR REPLACE FUNCTION can_edit()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'vendedor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## PASO 2: ACTUALIZAR POLÍTICAS RLS DE PRODUCTS

```sql
-- ELIMINAR política antigua de lectura pública
DROP POLICY IF EXISTS "Público puede ver catálogo de productos" ON products;

-- NUEVA: Lectura pública sigue permitida
CREATE POLICY "Lectura pública del catálogo"
  ON products FOR SELECT
  TO public
  USING (true);

-- NUEVA: Solo admins y vendedores pueden insertar
CREATE POLICY "Solo staff puede crear productos"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (can_edit());

-- NUEVA: Solo admins y vendedores pueden actualizar
CREATE POLICY "Solo staff puede actualizar productos"
  ON products FOR UPDATE
  TO authenticated
  USING (can_edit())
  WITH CHECK (can_edit());

-- NUEVA: Solo admins pueden eliminar
CREATE POLICY "Solo admins pueden eliminar productos"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());
```

---

## PASO 3: COMPONENTES DE FRONTEND

### 3.1 Context de Autenticación

**Archivo:** `src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface UserRole {
  role: 'admin' | 'vendedor' | 'lector';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserRole(userId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    setRole(data);
    setLoading(false);
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = role?.role === 'admin';
  const canEdit = role?.role === 'admin' || role?.role === 'vendedor';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        canEdit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 3.2 Página de Login

**Archivo:** `src/pages/Login.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast({ title: 'Inicio de sesión exitoso' });
      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Error al iniciar sesión',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Iniciar Sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3.3 Protección de Rutas

**Archivo:** `src/components/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

---

## PASO 4: ACTUALIZAR APP.TSX

```typescript
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/alimentos" element={<CatalogPage />} />
              <Route path="/accesorios" element={<CatalogPage />} />
              <Route path="/higiene" element={<CatalogPage />} />
              <Route path="/venenos" element={<CatalogPage />} />
            </Route>

            <Route path="/login" element={<Login />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

---

## PASO 5: MIGRAR ADMIN PAGE

**Cambios en `src/pages/Admin.tsx`:**

1. Eliminar `PinGate` component
2. Eliminar estado de `adminPin`
3. Usar `useAuth()` hook
4. Operaciones directas a Supabase (sin edge functions)

```typescript
import { useAuth } from '@/contexts/AuthContext';

const Admin = () => {
  const { user, isAdmin, canEdit, signOut } = useAuth();
  const queryClient = useQueryClient();

  const handleDelete = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    } else {
      toast({ title: 'Producto eliminado' });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  };

  // Similar para insert y update...
};
```

---

## PASO 6: CONFIGURAR SUPABASE DASHBOARD

### 6.1 Habilitar Email Auth
1. Dashboard > Authentication > Providers
2. Activar "Email"
3. Desactivar "Confirm email" (por simplicidad inicial)

### 6.2 Crear Primer Usuario Admin
```sql
-- Ejecutar en SQL Editor después de registrar primer usuario
INSERT INTO user_roles (user_id, role, created_by)
VALUES (
  'UUID_DEL_PRIMER_USUARIO',
  'admin',
  'UUID_DEL_PRIMER_USUARIO'
);
```

---

## PASO 7: ELIMINAR SISTEMA DE PIN

### 7.1 Edge Functions (Opcional: Mantener o Eliminar)

**Opción A: Eliminar Completamente**
- Borrar carpetas de functions
- Operaciones directas desde frontend con RLS

**Opción B: Mantener para Operaciones Críticas**
- Actualizar para usar `auth.uid()` en lugar de PIN
- Usar para validaciones complejas adicionales

### 7.2 Variables de Entorno
- Eliminar `ADMIN_PIN` de variables de entorno

---

## TESTING

### Casos de Prueba

1. **Usuario No Autenticado**
   - Puede ver catálogo
   - NO puede acceder a /admin
   - Redirige a /login

2. **Usuario Lector**
   - Puede ver catálogo
   - Puede acceder a /admin (vista lectura)
   - NO puede crear/editar/eliminar

3. **Usuario Vendedor**
   - Puede crear productos
   - Puede editar productos
   - NO puede eliminar productos

4. **Usuario Admin**
   - Control total
   - Puede asignar roles
   - Puede ver audit logs

---

## ROLLBACK PLAN

Si algo falla, revertir a sistema de PIN:

```sql
-- Deshabilitar nuevas políticas
DROP POLICY IF EXISTS "Solo staff puede crear productos" ON products;
DROP POLICY IF EXISTS "Solo staff puede actualizar productos" ON products;
DROP POLICY IF EXISTS "Solo admins pueden eliminar productos" ON products;

-- Restaurar política original
CREATE POLICY "Público puede ver catálogo de productos"
  ON products FOR SELECT
  TO public
  USING (true);
```

---

## CONCLUSIÓN

Esta guía proporciona una ruta clara y segura para migrar de PIN a autenticación completa.
Cada paso está aislado y puede probarse independientemente.

**Tiempo Estimado de Implementación:** 2-3 horas
**Complejidad:** Media
**Riesgo:** Bajo (con rollback plan preparado)
