-- Admin dashboard for Goan Kids Club.
-- 1. usage_daily: anonymous counters only (no ids, no names, no IP). Devices send small events; the server adds them up per day.
-- 2. shared_children: first name + progress, ONLY for children whose grown-up ticked "Share progress with Goan Kids Club".
--    Each child has a secret key on the device; only its hash is stored, so nobody else can change or remove that child.
-- 3. gkc_admin(pass): returns everything for the dashboard. The admin password hash lives in admin_secret
--    (set it with SQL, never commit it). All tables are locked; browsers can only call the functions below.

create table if not exists public.usage_daily (
  day   date   not null,
  kind  text   not null,
  game  text   not null default '',
  stage int    not null default -1,
  band  int    not null default 0,
  n     bigint not null default 0,
  stars bigint not null default 0,
  secs  bigint not null default 0,
  primary key (day, kind, game, stage, band)
);
alter table public.usage_daily enable row level security;
revoke all on public.usage_daily from anon, authenticated;

create table if not exists public.shared_children (
  id         text primary key,
  key_hash   text not null,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.shared_children enable row level security;
revoke all on public.shared_children from anon, authenticated;

create table if not exists public.admin_secret (
  id int primary key default 1 check (id = 1),
  pass_hash text not null
);
alter table public.admin_secret enable row level security;
revoke all on public.admin_secret from anon, authenticated;

-- Small integer from a json field, clamped; null/garbage -> default.
create or replace function public.gkc_int(v text, lo int, hi int, def int) returns int
language sql immutable set search_path = '' as $$
  select case when v ~ '^-?[0-9]{1,6}$' then least(greatest(v::int, lo), hi) else def end
$$;

-- Add up to 60 anonymous events: [{k, g, s, b, st, secs}].
create or replace function public.gkc_track(p_events jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare e jsonb; k text; g text; c int := 0; d date := (now() at time zone 'Europe/London')::date;
begin
  if p_events is null or jsonb_typeof(p_events) <> 'array' then return 0; end if;
  for e in select x from jsonb_array_elements(p_events) with ordinality as t(x, i) where i <= 60 loop
    if jsonb_typeof(e) <> 'object' then continue; end if;
    k := e->>'k';
    if k is null or k not in ('active','childday','newchild','play','quit','hour','sticker','lock','cloudon','limit','timer','support','share') then continue; end if;
    g := coalesce(e->>'g', '');
    if g !~ '^[a-z0-9]{0,16}$' then continue; end if;
    insert into public.usage_daily as u (day, kind, game, stage, band, n, stars, secs)
    values (d, k, g, public.gkc_int(e->>'s', -1, 200, -1), public.gkc_int(e->>'b', 0, 3, 0), 1,
            public.gkc_int(e->>'st', 0, 3, 0), public.gkc_int(e->>'secs', 0, 3600, 0))
    on conflict (day, kind, game, stage, band)
    do update set n = u.n + 1, stars = u.stars + excluded.stars, secs = u.secs + excluded.secs;
    c := c + 1;
  end loop;
  return c;
end $$;

-- Share (or update) one child's first name and progress. Returns false if the key does not match.
create or replace function public.gkc_share(p_id text, p_key text, p_data jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare h text; cur text;
begin
  if p_id is null or p_id !~ '^k[a-z0-9]{4,30}$' then raise exception 'bad id'; end if;
  if p_key is null or length(p_key) not between 16 and 80 then raise exception 'bad key'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 30000
     or length(coalesce(p_data->>'name', '')) > 20 then raise exception 'bad data'; end if;
  h := encode(extensions.digest(p_key, 'sha256'), 'hex');
  select key_hash into cur from public.shared_children where id = p_id;
  if cur is not null and cur <> h then return false; end if;
  insert into public.shared_children (id, key_hash, data, updated_at) values (p_id, h, p_data, now())
  on conflict (id) do update set data = excluded.data, updated_at = now();
  return true;
end $$;

-- Stop sharing: removes the child's row.
create or replace function public.gkc_unshare(p_id text, p_key text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.shared_children
  where id = p_id and key_hash = encode(extensions.digest(coalesce(p_key, ''), 'sha256'), 'hex');
  return found;
end $$;

-- Everything for the dashboard (last 120 days). Wrong password -> error after a short delay.
create or replace function public.gkc_admin(p_pass text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare ok boolean;
begin
  select extensions.crypt(coalesce(p_pass, ''), pass_hash) = pass_hash into ok from public.admin_secret where id = 1;
  if not coalesce(ok, false) then perform pg_sleep(1.5); raise exception 'wrong password'; end if;
  return jsonb_build_object(
    'today', (now() at time zone 'Europe/London')::date,
    'usage', coalesce((select jsonb_agg(jsonb_build_array(day, kind, game, stage, band, n, stars, secs))
                       from public.usage_daily where day > (now() at time zone 'Europe/London')::date - 120), '[]'::jsonb),
    'children', coalesce((select jsonb_agg(data || jsonb_build_object('updated', updated_at, 'since', created_at) order by updated_at desc)
                          from public.shared_children), '[]'::jsonb),
    'families', (select count(*) from public.family_progress),
    'family_children', (select coalesce(sum(jsonb_array_length(coalesce(data->'profiles', '[]'::jsonb))), 0) from public.family_progress)
  );
end $$;

revoke all on function public.gkc_int(text, int, int, int) from public, anon, authenticated;
revoke all on function public.gkc_track(jsonb), public.gkc_share(text, text, jsonb), public.gkc_unshare(text, text), public.gkc_admin(text) from public;
grant execute on function public.gkc_track(jsonb), public.gkc_share(text, text, jsonb), public.gkc_unshare(text, text), public.gkc_admin(text) to anon, authenticated;
