-- Add customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add customer_id to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- Create index for customers
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY customers_select ON public.customers
  FOR SELECT USING (true);

CREATE POLICY customers_insert ON public.customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY customers_update ON public.customers
  FOR UPDATE USING (true);

CREATE POLICY customers_delete ON public.customers
  FOR DELETE USING (true);
