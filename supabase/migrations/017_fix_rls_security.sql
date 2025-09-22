-- 017_fix_rls_security.sql
-- Fix RLS security issues identified by database linter

-- Enable RLS on tables that have existing policies but RLS is not yet enabled
ALTER TABLE public.budget_goals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.balance_sheet_manual_entries ENABLE ROW LEVEL SECURITY;

-- Enable RLS and create policies for categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories: Allow public read access, admin-only write access
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "categories_manage" ON public.categories;
CREATE POLICY "categories_manage" ON public.categories
  FOR ALL
  TO authenticated
  USING ((select auth.role()) = 'admin')
  WITH CHECK ((select auth.role()) = 'admin');

-- Enable RLS and create policies for product_complements table
ALTER TABLE public.product_complements ENABLE ROW LEVEL SECURITY;

-- Product complements: Allow authenticated users to read, admin-only write access
DROP POLICY IF EXISTS "product_complements_select" ON public.product_complements;
CREATE POLICY "product_complements_select" ON public.product_complements
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "product_complements_manage" ON public.product_complements;
CREATE POLICY "product_complements_manage" ON public.product_complements
  FOR ALL
  TO authenticated
  USING ((select auth.role()) = 'admin')
  WITH CHECK ((select auth.role()) = 'admin');

-- Ensure all policies take effect
