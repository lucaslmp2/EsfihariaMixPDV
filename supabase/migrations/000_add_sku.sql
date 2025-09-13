-- 000_add_sku.sql
-- Adiciona a coluna sku à tabela products e cria índice único
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS sku varchar(64);

-- Criar índice único para sku
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);

-- Rollback
-- DROP INDEX IF EXISTS idx_products_sku;
-- ALTER TABLE public.products DROP COLUMN IF EXISTS sku;
