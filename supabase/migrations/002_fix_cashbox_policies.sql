
-- Drop the old, overly restrictive policies
DROP POLICY IF EXISTS cash_boxes_manage ON public.cash_boxes;
DROP POLICY IF EXISTS cash_movements_manage ON public.cash_movements;

-- Policies for cash_boxes

-- 1. SELECT: Users can see their own cash boxes. Admins can see all.
CREATE POLICY cash_boxes_select ON public.cash_boxes
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id OR (select auth.role()) = 'admin');

-- 2. INSERT: Users can create cash boxes for themselves.
CREATE POLICY cash_boxes_insert ON public.cash_boxes
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- 3. UPDATE: Users can update (close) their own open cash boxes.
CREATE POLICY cash_boxes_update ON public.cash_boxes
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id AND closed_at IS NULL)
  WITH CHECK ((select auth.uid()) = user_id);

-- Policies for cash_movements

-- 1. SELECT: Users can see movements for cash boxes they have access to.
CREATE POLICY cash_movements_select ON public.cash_movements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cash_boxes cb
      WHERE cb.id = cash_box_id AND (cb.user_id = auth.uid() OR (select auth.role()) = 'admin')
    )
  );

-- 2. INSERT: Users can insert movements into their own open cash boxes.
CREATE POLICY cash_movements_insert ON public.cash_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cash_boxes cb
      WHERE cb.id = cash_box_id AND cb.user_id = auth.uid() AND cb.closed_at IS NULL
    )
  );

-- 3. DELETE: Users can delete movements from their own open cash boxes.
CREATE POLICY cash_movements_delete ON public.cash_movements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cash_boxes cb
      WHERE cb.id = cash_box_id AND cb.user_id = auth.uid() AND cb.closed_at IS NULL
    )
  );

