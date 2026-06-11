-- Таблица за местата за упражнение (карта)
create table if not exists public.practice_locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  type        text not null default 'other',
  lat         double precision not null,
  lng         double precision not null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Достъпът минава през service-role ключа в бекенда, затова RLS е изключено.
alter table public.practice_locations disable row level security;
