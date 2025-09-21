-- Add credit_balance column to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS credit_balance numeric(10,2) DEFAULT 0.00;

-- Update existing customers to have 0.00 credit_balance if null
UPDATE public.customers
SET credit_balance = 0.00
WHERE credit_balance IS NULL;

-- Add payment_method column to orders if not exists
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method text;

-- Add customer_id to orders if not exists (already in migration 009, but ensure)
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- Create index for credit_balance
CREATE INDEX IF NOT EXISTS idx_customers_credit_balance ON public.customers(credit_balance);
