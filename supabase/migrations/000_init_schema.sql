-- 000_init_schema.sql
-- Migration inicial: cria tabelas base para o PDV

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  role text DEFAULT 'atendente',
  created_at timestamptz DEFAULT now()
);

-- categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text,
  created_at timestamptz DEFAULT now()
);

-- products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(12,2) DEFAULT 0,
  active boolean DEFAULT true,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- product_complements
CREATE TABLE IF NOT EXISTS public.product_complements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text,
  table_number integer,
  status text DEFAULT 'aberto',
  total numeric(12,2) DEFAULT 0,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity integer DEFAULT 1,
  unit_price numeric(12,2) DEFAULT 0,
  total numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamptz DEFAULT now()
);

-- cash_boxes
CREATE TABLE IF NOT EXISTS public.cash_boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  starting_amount numeric(12,2) DEFAULT 0
);

-- cash_movements
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_box_id uuid REFERENCES public.cash_boxes(id) ON DELETE CASCADE,
  kind text,
  amount numeric(12,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- financial_entries
CREATE TABLE IF NOT EXISTS public.financial_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  amount numeric(12,2) DEFAULT 0,
  due_date date,
  paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- basic indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cash_boxes_opened_at ON public.cash_boxes(opened_at DESC);

-- end migration
