-- 000_fix_products_policy.sql
-- Ajusta políticas em public.products para permitir INSERTs do frontend por usuários autenticados

-- Garantir RLS habilitado (idempotente)
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

-- Remover policy global de gerenciamento que limitava todas as operações apenas a admins
DROP POLICY IF EXISTS products_manage ON public.products;

-- Permitir SELECT público em produtos ativos (já definido em outra migration) — manter

-- Criar policy para INSERT: qualquer usuário autenticado pode inserir produtos,
-- mas com restrições de validação para evitar rows inválidas.
DROP POLICY IF EXISTS products_insert ON public.products;
CREATE POLICY products_insert ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    name IS NOT NULL
    AND price IS NOT NULL
    AND price >= 0
  );

-- Criar policy para UPDATE e DELETE: somente admins podem atualizar/remover produtos
DROP POLICY IF EXISTS products_update ON public.products;
CREATE POLICY products_update ON public.products
  FOR UPDATE
  TO authenticated
  USING ((select auth.role()) = 'admin')
  WITH CHECK ((select auth.role()) = 'admin');

DROP POLICY IF EXISTS products_delete ON public.products;
CREATE POLICY products_delete ON public.products
  FOR DELETE
  TO authenticated
  USING ((select auth.role()) = 'admin');

-- Nota: esta política permite que o frontend crie produtos ao se autenticar.
-- Se você quer restringir criação somente a roles específicas (ex: 'admin' ou 'gerente'),
-- ajuste a condição em products_insert para ((select auth.role()) = 'admin' OR (select auth.role()) = 'gerente').
