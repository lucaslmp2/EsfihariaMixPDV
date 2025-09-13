-- 000_policies.sql
-- Habilita RLS e cria políticas básicas seguras

-- Habilitar RLS nas tabelas relevantes
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cash_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- profiles: owner ou admin
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (select auth.role()) = 'admin' OR (select auth.uid())::uuid = id
  );

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid())::uuid = id)
  WITH CHECK ((select auth.uid())::uuid = id);

-- products: publico pode ver produtos ativos; admin pode gerenciar
DROP POLICY IF EXISTS products_select ON public.products;
CREATE POLICY products_select ON public.products
  FOR SELECT
  TO anon, authenticated
  USING ((select auth.role()) = 'admin' OR active = true);

DROP POLICY IF EXISTS products_manage ON public.products;
CREATE POLICY products_manage ON public.products
  FOR ALL
  TO authenticated
  USING ((select auth.role()) = 'admin')
  WITH CHECK ((select auth.role()) = 'admin');

-- orders
DROP POLICY IF EXISTS orders_select ON public.orders;
CREATE POLICY orders_select ON public.orders
  FOR SELECT
  TO authenticated
  USING ((select auth.role()) = 'admin' OR (select auth.uid())::uuid = user_id);

DROP POLICY IF EXISTS orders_insert ON public.orders;
CREATE POLICY orders_insert ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.role()) = 'admin' OR (select auth.uid())::uuid = user_id);

DROP POLICY IF EXISTS orders_update ON public.orders;
CREATE POLICY orders_update ON public.orders
  FOR UPDATE
  TO authenticated
  USING ((select auth.role()) = 'admin' OR (select auth.uid())::uuid = user_id)
  WITH CHECK ((select auth.role()) = 'admin' OR (select auth.uid())::uuid = user_id);

-- order_items: authenticated can CRUD
DROP POLICY IF EXISTS order_items_all ON public.order_items;
CREATE POLICY order_items_all ON public.order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- cash boxes and movements
DROP POLICY IF EXISTS cash_boxes_manage ON public.cash_boxes;
CREATE POLICY cash_boxes_manage ON public.cash_boxes
  FOR ALL
  TO authenticated
  USING ((select auth.role()) = 'admin' OR (select auth.role()) = 'caixa')
  WITH CHECK ((select auth.role()) = 'admin' OR (select auth.role()) = 'caixa');

DROP POLICY IF EXISTS cash_movements_manage ON public.cash_movements;
CREATE POLICY cash_movements_manage ON public.cash_movements
  FOR ALL
  TO authenticated
  USING ((select auth.role()) = 'admin' OR (select auth.role()) = 'caixa')
  WITH CHECK ((select auth.role()) = 'admin' OR (select auth.role()) = 'caixa');

-- financial entries
DROP POLICY IF EXISTS financial_entries_manage ON public.financial_entries;
CREATE POLICY financial_entries_manage ON public.financial_entries
  FOR ALL
  TO authenticated
  USING ((select auth.role()) = 'admin' OR (select auth.role()) = 'financeiro')
  WITH CHECK ((select auth.role()) = 'admin' OR (select auth.role()) = 'financeiro');

-- Ensure policies take effect

-- end
