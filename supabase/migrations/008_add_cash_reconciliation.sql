-- Add reconciliation fields to cash_boxes table
ALTER TABLE public.cash_boxes
ADD COLUMN IF NOT EXISTS reconciliation_data jsonb,
ADD COLUMN IF NOT EXISTS reconciliation_notes text,
ADD COLUMN IF NOT EXISTS reconciled boolean DEFAULT false;

-- Update existing open cash boxes to have reconciled = false
UPDATE public.cash_boxes
SET reconciled = false
WHERE closed_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.cash_boxes.reconciliation_data IS 'JSON object containing payment types and amounts for reconciliation';
COMMENT ON COLUMN public.cash_boxes.reconciliation_notes IS 'Justification notes if reconciliation amounts do not match';
COMMENT ON COLUMN public.cash_boxes.reconciled IS 'Whether the cash register was properly reconciled before closing';
