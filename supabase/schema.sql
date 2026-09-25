create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_name text not null,
  dni text not null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  total numeric(10, 2) not null check (total >= 0),
  destination text not null check (destination in ('Arequipa', 'Provincia')),
  delivery_method text not null,
  is_custom boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'paid', 'delivered', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Allow anonymous order inserts"
on public.orders for insert
with check (true);

create policy "Allow anonymous order reads"
on public.orders for select
using (true);
