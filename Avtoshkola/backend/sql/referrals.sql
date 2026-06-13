-- Реферална програма: всеки профил получава уникален код, а поканите се записват.

-- 1) Реферален код в профилите
alter table public.profiles add column if not exists referral_code text unique;

-- 2) Записи за поканите
create table if not exists public.referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references public.profiles(id) on delete cascade,
  referred_id   uuid references public.profiles(id) on delete set null,
  referred_name text,
  created_at    timestamptz not null default now()
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_id);

-- Достъпът минава през service-role ключа в бекенда, затова RLS е изключено.
alter table public.referrals disable row level security;
