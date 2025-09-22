-- 018_fix_products_rls.sql
-- Fix RLS security issue for products table

-- Ensure products table has RLS enabled and proper policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products: public can view active products; admin can manage all
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products
  FOR SELECT
  TO anon, authenticated
  USING ((select auth.role()) = 'admin' OR active = true);

DROP POLICY IF EXISTS "products_manage" ON public.products;
CREATE POLICY "products_manage" ON public.products
  FOR ALL
  TO authenticated
  USING ((select auth.role()) = 'admin')
  WITH CHECK ((select auth.role()) = 'admin');

-- Ensure policies take effect
