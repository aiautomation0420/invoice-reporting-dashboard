-- Security hardening for a Supabase project shared with other workflows (e.g. an n8n RAG workflow).
-- Run in Supabase: SQL Editor > New query > paste > Run.
-- Safe for n8n: workflows that connect with the secret / service_role key or the postgres user skip
-- row-level security and keep their own privileges, so nothing here changes what they can do.

-- ── 1. Row-level security on EVERY table in the public schema ───────────────────────────────
-- First, see which tables don't have it yet (run this line alone if you want to look first):
--   select tablename from pg_tables where schemaname = 'public' and not rowsecurity;
-- Note: a table with RLS on and no policies is invisible to the publishable/anon key. If some app
-- reads a table with the anon key, give it its own policy instead of leaving RLS off.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and not rowsecurity loop
    execute format('alter table public.%I enable row level security', t.tablename);
    raise notice 'RLS enabled on %', t.tablename;
  end loop;
end $$;

-- ── 2. The website's key may read DEMO rows only ────────────────────────────────────────────
-- Even if the publishable key leaked, real invoices (is_demo = false) stay hidden.
drop policy if exists "dashboard can read" on invoices;
drop policy if exists "dashboard can read" on run_log;
drop policy if exists "dashboard can read" on error_log;
create policy "dashboard reads demo rows" on invoices  for select to anon using (is_demo);
create policy "dashboard reads demo rows" on run_log   for select to anon using (is_demo);
create policy "dashboard reads demo rows" on error_log for select to anon using (is_demo);

-- The website never reads vendors or purchase_orders, so the key gets no access to them at all.
drop policy if exists "dashboard can read" on vendors;
drop policy if exists "dashboard can read" on purchase_orders;

-- ── 3. Belt and braces: the website's key can never write to the invoice tables ────────────
-- (RLS already blocks writes; this also removes the table-level permission Supabase grants by default.)
revoke insert, update, delete, truncate on invoices, run_log, error_log, vendors, purchase_orders from anon, authenticated;

-- ── 4. Close the RAG search function to the public key ──────────────────────────────────────
-- match_documents can currently be called with the publishable key. It returns nothing today because
-- RLS protects "documents", but it shouldn't be callable from outside at all.
-- n8n's Supabase Vector Store node uses the service_role key, which keeps access.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'match_documents' loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
    raise notice 'Revoked public access to %', f.sig;
  end loop;
end $$;

-- ── Check the result ────────────────────────────────────────────────────────────────────────
select tablename, rowsecurity as rls_on from pg_tables where schemaname = 'public' order by tablename;
