-- Tables for the AI Invoice Processing & Audit Agent, matching the ones the n8n workflow uses.
-- Only for a NEW Supabase project. If the tables already exist, run add-dashboard-access.sql instead.
-- Run once in Supabase: SQL Editor > New query > paste > Run.

create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  is_demo boolean not null default false
);

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null,
  vendor text,
  amount numeric(12, 2),
  currency text default 'USD',
  created_at timestamptz not null default now(),
  is_demo boolean not null default false
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  vendor text,                         -- name as written on the invoice (null if the file could not be read)
  vendor_matched text,                 -- matching approved vendor, if any
  invoice_number text,
  invoice_date date,
  due_date date,
  currency text default 'USD',
  po_number text,
  line_items jsonb default '[]',       -- [{ "description", "quantity", "unit_price", "amount" }]
  subtotal numeric(12, 2),
  tax numeric(12, 2),
  total numeric(12, 2),
  confidence jsonb,                    -- AI extraction confidence per main field, 0-1
  status text not null check (status in ('clean', 'flagged', 'approved', 'rejected')),
  flag_reasons jsonb default '[]',     -- ["math_mismatch", ...] codes, see lib/config.ts
  fingerprint text,                    -- vendor|invoice_number|total, used to spot duplicates
  source text check (source in ('gmail', 'drive')),
  file_name text,
  file_id text,
  file_link text,
  gmail_message_id text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  is_demo boolean not null default false
);
create index invoices_created_at_idx on invoices (created_at desc);

create table run_log (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices (id) on delete cascade,
  processing_ms integer,
  minutes_saved numeric(6, 2),
  created_at timestamptz not null default now(),
  is_demo boolean not null default false
);

create table error_log (
  id uuid primary key default gen_random_uuid(),
  workflow text,
  node text,
  message text,
  run_link text,
  created_at timestamptz not null default now(),
  is_demo boolean not null default false
);

-- Read-only access for the website: same rules as add-dashboard-access.sql.
alter table vendors enable row level security;
alter table purchase_orders enable row level security;
alter table invoices enable row level security;
alter table run_log enable row level security;
alter table error_log enable row level security;

create policy "dashboard can read" on vendors for select to anon using (true);
create policy "dashboard can read" on purchase_orders for select to anon using (true);
create policy "dashboard can read" on invoices for select to anon using (true);
create policy "dashboard can read" on run_log for select to anon using (true);
create policy "dashboard can read" on error_log for select to anon using (true);

-- Later, to remove all demo data (keeps real rows):
-- delete from run_log where is_demo; delete from error_log where is_demo;
-- delete from invoices where is_demo; delete from purchase_orders where is_demo;
-- delete from vendors where is_demo;
