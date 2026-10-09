create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
-- No public policies: only the server-side Edge Function reads this table with the service role.
-- After creating your two Auth users, authorize them with:
-- insert into public.admin_users(user_id,email)
-- select id,email from auth.users where email in ('father@example.com','you@example.com')
-- on conflict (user_id) do update set email=excluded.email;
