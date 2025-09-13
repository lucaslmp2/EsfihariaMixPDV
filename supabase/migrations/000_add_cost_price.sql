-- 000_add_cost_price.sql
-- Adiciona a coluna cost_price à tabela products
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS cost_price numeric(12,2) DEFAULT 0;

-- Opcional: atualizar valores históricos se necessário
-- UPDATE public.products SET cost_price = price * 0.6 WHERE cost_price = 0; -- exemplo

-- Rollback
-- ALTER TABLE public.products DROP COLUMN IF EXISTS cost_price;
