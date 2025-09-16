-- Add tables for fixed and variable costs
CREATE TABLE IF NOT EXISTS public.fixed_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  frequency text NOT NULL DEFAULT 'Mensal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.variable_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variable_costs ENABLE ROW LEVEL SECURITY;

-- Create policies for fixed_costs
CREATE POLICY fixed_costs_select ON public.fixed_costs
  FOR SELECT USING (true);

CREATE POLICY fixed_costs_insert ON public.fixed_costs
  FOR INSERT WITH CHECK (true);

CREATE POLICY fixed_costs_update ON public.fixed_costs
  FOR UPDATE USING (true);

CREATE POLICY fixed_costs_delete ON public.fixed_costs
  FOR DELETE USING (true);

-- Create policies for variable_costs
CREATE POLICY variable_costs_select ON public.variable_costs
  FOR SELECT USING (true);

CREATE POLICY variable_costs_insert ON public.variable_costs
  FOR INSERT WITH CHECK (true);

CREATE POLICY variable_costs_update ON public.variable_costs
  FOR UPDATE USING (true);

CREATE POLICY variable_costs_delete ON public.variable_costs
  FOR DELETE USING (true);

-- Insert some sample data
INSERT INTO public.fixed_costs (name, amount, frequency) VALUES
  ('Aluguel', 1200.00, 'Mensal'),
  ('Salários', 2500.00, 'Mensal'),
  ('Energia', 180.00, 'Mensal');

INSERT INTO public.variable_costs (name, amount, date) VALUES
  ('Ingredientes', 320.50, '2024-01-15'),
  ('Embalagens', 85.20, '2024-01-14'),
  ('Delivery', 45.30, '2024-01-13');
