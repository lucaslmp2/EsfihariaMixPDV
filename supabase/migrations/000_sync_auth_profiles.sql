-- 000_sync_auth_profiles.sql
-- Sincroniza auth.users -> public.profiles: função upsert + triggers + backfill

-- Função pública que faz UPSERT no public.profiles
CREATE OR REPLACE FUNCTION public.upsert_profile(p_id uuid, p_name text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, name, created_at)
  VALUES (p_id, COALESCE(p_name, ''), now())
  ON CONFLICT (id) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, public.profiles.name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nota: SECURITY DEFINER faz a função rodar com privilégios do dono. Em ambientes Supabase,
-- crie essa função como um role controlado (service_role) ou revise permissões conforme necessário.

-- Trigger functions no schema auth que chamam a upsert
CREATE OR REPLACE FUNCTION auth.handle_user_created()
RETURNS trigger AS $$
BEGIN
  PERFORM public.upsert_profile(NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auth.handle_user_updated()
RETURNS trigger AS $$
BEGIN
  PERFORM public.upsert_profile(NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers no auth.users
DROP TRIGGER IF EXISTS handle_user_created ON auth.users;
CREATE TRIGGER handle_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION auth.handle_user_created();

DROP TRIGGER IF EXISTS handle_user_updated ON auth.users;
CREATE TRIGGER handle_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION auth.handle_user_updated();

-- Backfill: inserir perfis faltantes a partir de auth.users
INSERT INTO public.profiles (id, name, created_at)
SELECT u.id, COALESCE(u.email, ''), now()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Opcional: se desejar remover perfis quando usuário deletado, adicione trigger para DELETE que
-- remova ou marque o perfil. Atualmente mantemos o perfil para histórico.
