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
  delivery_cost numeric(10, 2) not null default 0 check (delivery_cost >= 0),
  delivery_payment_status text not null default 'pending' check (delivery_payment_status in ('pending', 'paid')),
  is_custom boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'paid', 'delivered', 'cancelled')),
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'delivered')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists delivery_status text not null default 'pending';
alter table public.orders add column if not exists payment_status text not null default 'pending';
alter table public.orders add column if not exists delivery_cost numeric(10, 2) not null default 0;
alter table public.orders add column if not exists delivery_payment_status text not null default 'pending';

update public.orders
set delivery_status = case when status = 'delivered' then 'delivered' else 'pending' end,
    payment_status = case when status = 'paid' then 'paid' else 'pending' end;

alter table public.orders drop constraint if exists orders_delivery_status_check;
alter table public.orders add constraint orders_delivery_status_check check (delivery_status in ('pending', 'delivered'));
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check (payment_status in ('pending', 'paid'));
alter table public.orders drop constraint if exists orders_delivery_cost_check;
alter table public.orders add constraint orders_delivery_cost_check check (delivery_cost >= 0);
alter table public.orders drop constraint if exists orders_delivery_payment_status_check;
alter table public.orders add constraint orders_delivery_payment_status_check check (delivery_payment_status in ('pending', 'paid'));

alter table public.orders enable row level security;

create policy "Allow anonymous order inserts"
on public.orders for insert
with check (true);

create policy "Allow anonymous order reads"
on public.orders for select
using (true);
