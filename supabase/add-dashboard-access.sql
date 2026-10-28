-- For a project where the invoice tables ALREADY exist (created by the n8n workflow).
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Safe: it only adds a column and read permissions. It never changes or deletes data.

-- 1) Mark seeded demo rows, so they can be deleted later. Real rows get false automatically.
alter table invoices        add column if not exists is_demo boolean not null default false;
alter table vendors         add column if not exists is_demo boolean not null default false;
alter table purchase_orders add column if not exists is_demo boolean not null default false;
alter table run_log         add column if not exists is_demo boolean not null default false;
alter table error_log       add column if not exists is_demo boolean not null default false;

-- 2) Let the website (publishable key) READ these 5 tables. It can't write, and can't see other tables.
-- n8n is not affected if it connects with the secret/service_role key or the postgres user (both skip these rules).
alter table invoices        enable row level security;
alter table vendors         enable row level security;
alter table purchase_orders enable row level security;
alter table run_log         enable row level security;
alter table error_log       enable row level security;

drop policy if exists "dashboard can read" on invoices;
drop policy if exists "dashboard can read" on vendors;
drop policy if exists "dashboard can read" on purchase_orders;
drop policy if exists "dashboard can read" on run_log;
drop policy if exists "dashboard can read" on error_log;

create policy "dashboard can read" on invoices        for select to anon using (true);
create policy "dashboard can read" on vendors         for select to anon using (true);
create policy "dashboard can read" on purchase_orders for select to anon using (true);
create policy "dashboard can read" on run_log         for select to anon using (true);
create policy "dashboard can read" on error_log       for select to anon using (true);
