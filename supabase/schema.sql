create table if not exists public.menu_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 80),
  description text not null default '',
  price numeric(8, 2) not null check (price > 0),
  emoji text not null default '🫓',
  available boolean not null default true,
  is_special boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.menu_admins enable row level security;
alter table public.menu_items enable row level security;

create or replace function public.is_menu_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.menu_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_menu_admin() from public;
grant execute on function public.is_menu_admin() to authenticated;

revoke all on public.menu_admins from anon, authenticated;
revoke all on public.menu_items from anon, authenticated;
grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;

drop policy if exists "Anyone can read available menu items" on public.menu_items;
create policy "Anyone can read available menu items"
on public.menu_items for select to anon
using (available = true);

drop policy if exists "Admins can read all menu items" on public.menu_items;
create policy "Admins can read all menu items"
on public.menu_items for select to authenticated
using ((select public.is_menu_admin()));

drop policy if exists "Admins can add menu items" on public.menu_items;
create policy "Admins can add menu items"
on public.menu_items for insert to authenticated
with check ((select public.is_menu_admin()));

drop policy if exists "Admins can update menu items" on public.menu_items;
create policy "Admins can update menu items"
on public.menu_items for update to authenticated
using ((select public.is_menu_admin()))
with check ((select public.is_menu_admin()));

drop policy if exists "Admins can remove menu items" on public.menu_items;
create policy "Admins can remove menu items"
on public.menu_items for delete to authenticated
using ((select public.is_menu_admin()));

insert into public.menu_items (name, description, price, emoji, is_special, sort_order)
values
  ('Aloo Parantha', 'Whole-wheat parantha stuffed with spiced potatoes, served with curd and pickle.', 80, '🥔', true, 1),
  ('Paneer Parantha', 'Golden, flaky parantha filled with seasoned paneer.', 110, '🧀', false, 2),
  ('Gobi Parantha', 'A homestyle cauliflower-stuffed parantha, fresh off the tawa.', 90, '🥬', false, 3),
  ('Mooli Parantha', 'Crisp whole-wheat parantha stuffed with spiced grated radish.', 90, '🌱', false, 4)
on conflict (name) do nothing;
