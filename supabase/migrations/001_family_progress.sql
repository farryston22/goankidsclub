-- Optional online saving for Goan Kids Club (Supabase project "goankidsclub").
-- No accounts: a family code is the key. Only its SHA-256 hash is stored.
-- The table is locked (RLS on, no policies); browsers can only call the three functions below.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.family_progress (
  code_hash  text primary key,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.family_progress enable row level security;
revoke all on public.family_progress from anon, authenticated;

create or replace function public.gkc_hash(p_code text) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(upper(trim(p_code)), 'sha256'), 'hex')
$$;

-- Load: returns {data, updated_at} or null.
create or replace function public.gkc_load(p_code text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('data', f.data, 'updated_at', f.updated_at)
  from public.family_progress f
  where length(p_code) between 16 and 80 and f.code_hash = public.gkc_hash(p_code)
$$;

-- Save (create or replace). Rejects short codes and anything bigger than 300 KB.
create or replace function public.gkc_save(p_code text, p_data jsonb) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare t timestamptz := now();
begin
  if p_code is null or length(p_code) not between 16 and 80 then raise exception 'bad code'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 300000 then raise exception 'bad data'; end if;
  insert into public.family_progress (code_hash, data, updated_at)
  values (public.gkc_hash(p_code), p_data, t)
  on conflict (code_hash) do update set data = excluded.data, updated_at = t;
  return t;
end $$;

-- Delete the online copy for a code.
create or replace function public.gkc_delete(p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.family_progress where code_hash = public.gkc_hash(p_code);
  return found;
end $$;

revoke all on function public.gkc_hash(text), public.gkc_load(text), public.gkc_save(text, jsonb), public.gkc_delete(text) from public;
revoke execute on function public.gkc_hash(text) from anon, authenticated;
grant execute on function public.gkc_load(text), public.gkc_save(text, jsonb), public.gkc_delete(text) to anon, authenticated;
