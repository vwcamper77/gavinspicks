-- Apply to the dedicated Gavin's Picks Supabase project only.
create table if not exists public.gavin_private_records (
  collection text not null check (collection in ('sold-reports','availability-reviews','curation-decisions','leads')),
  id text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  primary key (collection, id)
);
alter table public.gavin_private_records enable row level security;
revoke all on public.gavin_private_records from public, anon, authenticated;
grant select, insert, update, delete on public.gavin_private_records to service_role;
