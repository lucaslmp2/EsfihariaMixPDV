-- 019_fix_financial_access.sql
-- Fix financial data access issue after RLS changes

-- Check if financial_entries table has user_id or owner_id column
-- If it does, allow users to access their own financial entries

DO $$
BEGIN
    -- Check if user_id column exists in financial_entries
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'financial_entries'
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        -- Update policy to allow users to access their own financial entries
        DROP POLICY IF EXISTS "financial_entries_manage" ON public.financial_entries;
        CREATE POLICY "financial_entries_manage" ON public.financial_entries
          FOR ALL
          TO authenticated
          USING (
            (select auth.role()) = 'admin'
            OR (select auth.role()) = 'financeiro'
            OR (select auth.uid())::uuid = user_id
          )
          WITH CHECK (
            (select auth.role()) = 'admin'
            OR (select auth.role()) = 'financeiro'
            OR (select auth.uid())::uuid = user_id
          );
    ELSE
        -- If no user_id column, make policy more permissive for reading
        -- Keep strict controls for write operations
        DROP POLICY IF EXISTS "financial_entries_manage" ON public.financial_entries;
        CREATE POLICY "financial_entries_select" ON public.financial_entries
          FOR SELECT
          TO authenticated
          USING (
            (select auth.role()) = 'admin'
            OR (select auth.role()) = 'financeiro'
            OR (select auth.role()) = 'caixa'
          );

        CREATE POLICY "financial_entries_manage" ON public.financial_entries
          FOR ALL
          TO authenticated
          USING (
            (select auth.role()) = 'admin'
            OR (select auth.role()) = 'financeiro'
          )
          WITH CHECK (
            (select auth.role()) = 'admin'
            OR (select auth.role()) = 'financeiro'
          );
    END IF;
END $$;

-- Ensure policies take effect
