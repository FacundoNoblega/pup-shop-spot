
-- Remove the overly permissive ALL policy
DROP POLICY IF EXISTS "Permitir gestion total" ON public.products;

-- Keep "Permitir lectura publica" for public catalog reads
-- Ensure no write access via client
