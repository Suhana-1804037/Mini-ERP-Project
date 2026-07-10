create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  category text not null,
  supplier_id uuid,
  purchase_price numeric not null default 0,
  selling_price numeric not null default 0,
  stock integer not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_code text,
  name text not null,
  email text not null,
  phone text not null,
  address text not null,
  created_at timestamptz not null default now()
);

alter table public.suppliers add column if not exists supplier_code text;
alter table public.products add column if not exists supplier_id uuid;
do $$
begin
  alter table public.products
    add constraint products_supplier_id_fkey
    foreign key (supplier_id) references public.suppliers(id) on delete set null;
exception
  when duplicate_object then null;
end $$;

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  purchase_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  sale_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.sales enable row level security;

create policy "Authenticated users can read all rows" on public.products for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert rows" on public.products for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update rows" on public.products for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete rows" on public.products for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can read all rows" on public.customers for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert rows" on public.customers for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update rows" on public.customers for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete rows" on public.customers for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can read all rows" on public.suppliers for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert rows" on public.suppliers for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update rows" on public.suppliers for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete rows" on public.suppliers for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can read all rows" on public.purchases for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert rows" on public.purchases for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update rows" on public.purchases for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete rows" on public.purchases for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can read all rows" on public.sales for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert rows" on public.sales for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update rows" on public.sales for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete rows" on public.sales for delete using (auth.role() = 'authenticated');
