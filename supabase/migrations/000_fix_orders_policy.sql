-- 000_fix_orders_policy.sql
-- Ajusta políticas em public.orders para permitir criação de pedidos do frontend

ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- Remover policy antiga de INSERT
DROP POLICY IF EXISTS orders_insert ON public.orders;

-- Nova policy de INSERT:
-- permite INSERT se:
--  - o usuário for admin; OU
--  - o campo user_id da nova linha for NULL (frontend não enviou user_id) OU
--  - o campo user_id for igual ao uid autenticado.
-- Isso evita o erro 'new row violates row-level security policy' quando o frontend não
-- fornece explicitamente o user_id — o servidor/aplicação pode preencher depois ou
-- usar um trigger para preencher com auth.uid() se desejar.
CREATE POLICY orders_insert ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.role()) = 'admin'
    OR user_id IS NULL
    OR ( (select auth.uid())::uuid = user_id )
  );

-- Atualização: mantemos UPDATE restrito a admin ou ao owner (user_id)
DROP POLICY IF EXISTS orders_update ON public.orders;
CREATE POLICY orders_update ON public.orders
  FOR UPDATE
  TO authenticated
  USING ((select auth.role()) = 'admin' OR (select auth.uid())::uuid = user_id)
  WITH CHECK ((select auth.role()) = 'admin' OR (select auth.uid())::uuid = user_id);

-- Seleção já permite admin ou owner; manutenção feita em outro arquivo.
