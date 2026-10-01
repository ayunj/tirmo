-- 트리모 기본 구조
-- Supabase 대시보드 › SQL Editor 에 통째로 붙여넣고 Run 하면 돼요.

create extension if not exists pgcrypto;

-- ───────────── 사람 ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  color text not null default '#E48AA3',
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- 구글로 처음 로그인하면 구글 이름으로 프로필을 만들어 둬요 (이름 정하기 화면에서 바꿔요)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── 여행 ─────────────
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date,
  end_date date,
  kind text not null default 'abroad' check (kind in ('abroad','domestic')),
  countries text[] not null default '{}',   -- 나라 코드 (jp, th ...)
  cities text[] not null default '{}',      -- 국내여행 도시
  cover_color text not null default '#4DA3FF',
  cover_photo text,
  currency text not null default 'JPY',
  rate_unit int not null default 100,       -- ¥100 = ₩920 이면 100
  rate numeric not null default 920,        -- 원화 금액
  invite_code text not null unique default substr(replace(gen_random_uuid()::text,'-',''),1,10),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner','editor','viewer')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- 멤버 이름을 같이 불러오려고 프로필과 연결
do $$ begin
  alter table public.trip_members add constraint trip_members_profile_fk foreign key (user_id) references public.profiles(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- 이 여행 멤버인지
create or replace function public.is_member(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from trip_members where trip_id = t and user_id = auth.uid());
$$;

create or replace function public.can_edit(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from trip_members where trip_id = t and user_id = auth.uid() and role in ('owner','editor'));
$$;

-- 여행 만들기: 여행 + 방장 멤버를 한 번에
create or replace function public.create_trip(
  p_title text, p_start date, p_end date, p_kind text, p_countries text[], p_cities text[],
  p_cover_color text, p_currency text, p_rate_unit int, p_rate numeric
) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into trips (title, start_date, end_date, kind, countries, cities, cover_color, currency, rate_unit, rate, created_by)
  values (p_title, p_start, p_end, coalesce(p_kind,'abroad'), coalesce(p_countries,'{}'), coalesce(p_cities,'{}'),
          coalesce(p_cover_color,'#4DA3FF'), coalesce(p_currency,'KRW'), coalesce(p_rate_unit,1), coalesce(p_rate,1), auth.uid())
  returning id into new_id;
  insert into trip_members (trip_id, user_id, role) values (new_id, auth.uid(), 'owner');
  return new_id;
end $$;

-- 초대 링크로 들어오기
create or replace function public.join_trip(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into t from trips where invite_code = p_code;
  if t is null then raise exception 'invalid code'; end if;
  insert into trip_members (trip_id, user_id, role) values (t, auth.uid(), 'editor')
  on conflict do nothing;
  return t;
end $$;

-- 초대 링크로 들어오기 전에 여행 이름 미리보기
create or replace function public.peek_invite(p_code text)
returns table (id uuid, title text, start_date date, end_date date, cover_color text, members int)
language sql stable security definer set search_path = public as $$
  select t.id, t.title, t.start_date, t.end_date, t.cover_color,
         (select count(*)::int from trip_members m where m.trip_id = t.id)
  from trips t where t.invite_code = p_code;
$$;

-- ───────────── 일정 ─────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day date,                       -- 비어 있으면 '날짜 미정'
  time_text text,                 -- '14:30', '오후' 처럼 자유롭게. 비면 시간 없음
  sort numeric not null default 0,
  title text not null,
  category text not null default '기타',   -- 관광지, 음식점, 카페, 숙소, 쇼핑, 교통, 체험, 기타
  memo text,
  address text,
  link text,
  photo text,
  move_mode text,                 -- 이 일정까지 가는 방법: walk, transit, taxi, car
  move_note text,                 -- '공항버스 30분 · ¥500'
  booking_id uuid,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists events_trip_day on public.events (trip_id, day, sort);

-- ───────────── 예약 ─────────────
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  kind text not null check (kind in ('flight','hotel','car','restaurant','tour','etc')),
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status text,                    -- 예약 완료, 예약 오픈 대기, 현장 줄서기 ...
  open_at timestamptz,            -- 식당 예약이 열리는 때
  details jsonb not null default '{}',  -- 편명, 좌석, 예약번호 등 종류별 칸
  amount numeric,
  currency text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

-- ───────────── 경비 ─────────────
create table if not exists public.pockets (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  kind text not null default 'cash' check (kind in ('cash','card','bank')),
  currency text not null,
  budget numeric not null default 0,
  shared boolean not null default false,     -- 공동경비
  owner_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  pocket_id uuid references public.pockets(id) on delete set null,
  payer_id uuid references auth.users(id),   -- 비어 있으면 공동경비
  amount numeric not null,
  currency text not null,
  category text not null default '기타',
  title text not null,
  spent_at timestamptz not null default now(),
  memo text,
  split jsonb,                               -- 나눠 내기 {mode:'eq'|'own', shares:{user_id: amount}}
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

-- ───────────── 기록 ─────────────
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  title text,
  body text,
  mood text,
  weather text,
  place text,
  taken_at timestamptz not null default now(),
  photos text[] not null default '{}',
  in_pdf boolean not null default true,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

-- ───────────── 준비물 · 위시리스트 ─────────────
create table if not exists public.pack_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null default '필수',
  name text not null,
  done boolean not null default false,
  pinned boolean not null default false,
  assignee uuid references auth.users(id),   -- 비어 있으면 다 같이
  booking_id uuid references public.bookings(id) on delete set null,
  sort numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  kind text not null default 'place' check (kind in ('place','shop')),
  name text not null,
  category text,
  memo text,
  link text,
  photo text,
  status text,          -- 쇼핑: todo, buy, no, q
  shop_group text,      -- 쇼핑: 어디서 살지
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

-- ───────────── 권한 (RLS) ─────────────
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.events enable row level security;
alter table public.bookings enable row level security;
alter table public.pockets enable row level security;
alter table public.expenses enable row level security;
alter table public.entries enable row level security;
alter table public.pack_items enable row level security;
alter table public.wishes enable row level security;

-- 프로필: 로그인한 사람은 이름·색을 볼 수 있고, 내 것만 고쳐요
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());

-- 여행: 멤버만 보고, 편집 권한이 있으면 고치고, 방장만 지워요 (만들기는 create_trip 함수로)
drop policy if exists "trips read" on public.trips;
create policy "trips read" on public.trips for select to authenticated using (public.is_member(id));
drop policy if exists "trips update" on public.trips;
create policy "trips update" on public.trips for update to authenticated using (public.can_edit(id));
drop policy if exists "trips delete" on public.trips;
create policy "trips delete" on public.trips for delete to authenticated using (created_by = auth.uid());

-- 멤버 목록: 같은 여행 멤버끼리 보고, 내가 나가는 건 내가 해요
drop policy if exists "members read" on public.trip_members;
create policy "members read" on public.trip_members for select to authenticated using (public.is_member(trip_id));
drop policy if exists "members leave" on public.trip_members;
create policy "members leave" on public.trip_members for delete to authenticated using (user_id = auth.uid());

-- 나머지 표는 모두 같은 규칙: 멤버는 보고, 편집 권한이 있으면 쓰고 고치고 지워요
do $$
declare t text;
begin
  foreach t in array array['events','bookings','pockets','expenses','entries','pack_items','wishes'] loop
    execute format('drop policy if exists "%1$s read" on public.%1$s', t);
    execute format('create policy "%1$s read" on public.%1$s for select to authenticated using (public.is_member(trip_id))', t);
    execute format('drop policy if exists "%1$s write" on public.%1$s', t);
    execute format('create policy "%1$s write" on public.%1$s for insert to authenticated with check (public.can_edit(trip_id))', t);
    execute format('drop policy if exists "%1$s update" on public.%1$s', t);
    execute format('create policy "%1$s update" on public.%1$s for update to authenticated using (public.can_edit(trip_id))', t);
    execute format('drop policy if exists "%1$s delete" on public.%1$s', t);
    execute format('create policy "%1$s delete" on public.%1$s for delete to authenticated using (public.can_edit(trip_id))', t);
  end loop;
end $$;

-- 같이 쓰는 화면이 바로 바뀌도록 실시간 전송 켜기
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.events'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.expenses'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.pack_items'; exception when others then null; end;
end $$;
