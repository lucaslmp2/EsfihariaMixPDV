-- 000_sync_auth_profiles_simple.sql
-- Versão sem triggers em schema auth: cria public.upsert_profile e faz backfill de auth.users

CREATE OR REPLACE FUNCTION public.upsert_profile(p_id uuid, p_name text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, name, created_at)
  VALUES (p_id, COALESCE(p_name, ''), now())
  ON CONFLICT (id) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, public.profiles.name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: inserir perfis faltantes a partir de auth.users
INSERT INTO public.profiles (id, name, created_at)
SELECT u.id, COALESCE(u.email, ''), now()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Nota: esta versão não cria triggers no schema auth. Para criar triggers automáticos é
-- necessário executar a versão completa com role service_role (veja instruções).
