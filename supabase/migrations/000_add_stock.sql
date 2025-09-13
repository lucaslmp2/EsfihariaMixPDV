-- 000_add_stock.sql
-- Adiciona a coluna stock à tabela products
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0;

-- Garantir que stock nunca seja negativo
-- Remova qualquer constraint existente antes de adicionar (compatível com Postgres)
ALTER TABLE IF EXISTS public.products
  DROP CONSTRAINT IF EXISTS chk_products_stock_nonnegative;
ALTER TABLE IF EXISTS public.products
  ADD CONSTRAINT chk_products_stock_nonnegative CHECK (stock >= 0);

-- Rollback
-- ALTER TABLE public.products DROP CONSTRAINT IF EXISTS chk_products_stock_nonnegative;
-- ALTER TABLE public.products DROP COLUMN IF EXISTS stock;
