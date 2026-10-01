-- 트리모 2단계: 예약 · 준비물 · 경비 · 위시리스트 · 기록 · 사진
-- Supabase 대시보드 › SQL Editor 에 통째로 붙여넣고 Run 하면 돼요. 여러 번 돌려도 괜찮아요.

-- 일정 ↔ 예약 · 가고싶은곳 연결
alter table public.events add column if not exists wish_id uuid;
do $$ begin
  alter table public.events add constraint events_booking_fk foreign key (booking_id) references public.bookings(id) on delete set null;
exception when others then null; end $$;
do $$ begin
  alter table public.events add constraint events_wish_fk foreign key (wish_id) references public.wishes(id) on delete set null;
exception when others then null; end $$;

-- 예약: 메모 · 링크 · 캡처 사진
alter table public.bookings add column if not exists memo text;
alter table public.bookings add column if not exists link text;
alter table public.bookings add column if not exists photos text[] not null default '{}';
alter table public.bookings add column if not exists sort_key text;   -- 날짜·시간 정렬용 '2026-10-10 11:10'

-- 경비: 여행 날짜 · 시간 (시간대 문제 없이 그대로 적어 둬요)
alter table public.expenses add column if not exists day date;          -- 비어 있으면 '준비 · 여행 전'
alter table public.expenses add column if not exists time_text text;
alter table public.expenses add column if not exists booking_id uuid references public.bookings(id) on delete set null;

-- 정산: 보낸 돈 기록
create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  from_id uuid not null references auth.users(id),
  to_id uuid not null references auth.users(id),
  amount numeric not null,          -- 원화
  created_at timestamptz not null default now()
);

-- 준비물 메모
alter table public.pack_items add column if not exists memo text;

-- 위시리스트: 주소 · 사진 여러 장
alter table public.wishes add column if not exists address text;
alter table public.wishes add column if not exists photos text[] not null default '{}';

-- 기록: 여행 날짜 · 시간
alter table public.entries add column if not exists day date;
alter table public.entries add column if not exists time_text text;

-- 권한
alter table public.transfers enable row level security;
drop policy if exists "transfers read" on public.transfers;
create policy "transfers read" on public.transfers for select to authenticated using (public.is_member(trip_id));
drop policy if exists "transfers write" on public.transfers;
create policy "transfers write" on public.transfers for insert to authenticated with check (public.can_edit(trip_id));
drop policy if exists "transfers delete" on public.transfers;
create policy "transfers delete" on public.transfers for delete to authenticated using (public.can_edit(trip_id));

-- 실시간
do $$
declare t text;
begin
  foreach t in array array['bookings','pockets','entries','wishes','transfers'] loop
    begin execute format('alter publication supabase_realtime add table public.%s', t); exception when others then null; end;
  end loop;
end $$;

-- ───────────── 사진 저장소 ─────────────
-- 사진 주소는 길고 무작위라 링크를 아는 사람만 볼 수 있어요. 올리고 지우는 건 여행 멤버만.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','image/heic'])
on conflict (id) do update set public = true;

drop policy if exists "photos upload" on storage.objects;
create policy "photos upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.can_edit(((storage.foldername(name))[1])::uuid));
drop policy if exists "photos delete" on storage.objects;
create policy "photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.can_edit(((storage.foldername(name))[1])::uuid));
