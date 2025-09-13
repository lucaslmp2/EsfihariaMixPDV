-- 000_fill_orders_user_id.sql
-- Função e trigger para preencher orders.user_id com auth.uid() quando NULL

-- Função com segurança para executar como DEFINER (requer usuário com permissões para criar funções)
CREATE OR REPLACE FUNCTION public.fill_order_user_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    -- auth.uid() está disponível quando chamado via Supabase Edge com contexto autenticado
    BEGIN
      NEW.user_id := (select auth.uid())::uuid;
    EXCEPTION WHEN others THEN
      -- se auth.uid() não estiver disponível, manter NULL
      NEW.user_id := NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger BEFORE INSERT que chama a função
DROP TRIGGER IF EXISTS trg_fill_order_user_id ON public.orders;
CREATE TRIGGER trg_fill_order_user_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fill_order_user_id();

-- Nota: SECURITY DEFINER permite que a função rode com privilégios do dono da função. 
-- Em produção, crie a função com um role seguro (service_role ou outro) e proteja o acesso.
