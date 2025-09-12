-- Script: sync_auth_profiles.sql
-- Propósito: sincronizar mudanças em auth.users com a tabela public.profiles
-- Instruções: executar no SQL editor do Supabase (schema public/auth conforme necessário)

-- 1) Cria função que insere ou atualiza profiles a partir de auth.users
create or replace function public.handle_auth_user_insert()
returns trigger language plpgsql as $$
begin
  -- Inserir ou atualizar registro em public.profiles
  insert into public.profiles(id, name, created_at)
  values (new.id, coalesce(new.user_metadata->> 'name', new.email), now())
  on conflict (id) do update set
    name = coalesce(new.user_metadata->> 'name', new.email),
    created_at = coalesce(public.profiles.created_at, now());

  return new;
end;
$$;

-- 2) Função para remover profile quando usuário é excluído
create or replace function public.handle_auth_user_delete()
returns trigger language plpgsql as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

-- 3) Criar triggers no schema auth (tabela users)
-- Observação: dependendo do projeto Supabase, a tabela de usuários está em schema "auth" e nome "users".
-- Execute os comandos abaixo com permissões adequadas no SQL editor do Supabase.

drop trigger if exists auth_user_insert on auth.users;
create trigger auth_user_insert
after insert on auth.users
for each row execute function public.handle_auth_user_insert();

drop trigger if exists auth_user_delete on auth.users;
create trigger auth_user_delete
after delete on auth.users
for each row execute function public.handle_auth_user_delete();

-- 4) Opcional: sincronizar updates (por exemplo, quando metadata muda)
create or replace function public.handle_auth_user_update()
returns trigger language plpgsql as $$
begin
  update public.profiles set
    name = coalesce(new.user_metadata->> 'name', new.email)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists auth_user_update on auth.users;
create trigger auth_user_update
after update on auth.users
for each row execute function public.handle_auth_user_update();

-- 5) Garantir a existência da coluna name e constraints na tabela profiles
-- Se a tabela profiles não existir, este bloco é um helper para criar estrutura mínima
create table if not exists public.profiles (
  id uuid primary key,
  name text not null,
  role text default 'atendente',
  created_at timestamp without time zone default now()
);

-- Fim do script
