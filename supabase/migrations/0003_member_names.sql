-- 트리모 3단계: 멤버 이름 연결 + 포켓 채우기
-- Supabase 대시보드 › SQL Editor 에 통째로 붙여넣고 Run 하면 돼요. 여러 번 돌려도 괜찮아요.

-- 여행 멤버 ↔ 이름(프로필) 연결. 이게 없으면 여행 화면이 열리지 않아요.
do $$ begin
  alter table public.trip_members add constraint trip_members_profile_fk foreign key (user_id) references public.profiles(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- 포켓에 돈 채우기 (추가 환전, ATM 인출 ...)
create table if not exists public.topups (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  pocket_id uuid not null references public.pockets(id) on delete cascade,
  amount numeric not null,
  how text,                 -- 추가 환전, ATM 인출, 카드 충전 ...
  day date,
  rate_text text,           -- ¥100 = ₩935
  krw numeric,
  memo text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.topups enable row level security;
drop policy if exists "topups read" on public.topups;
create policy "topups read" on public.topups for select to authenticated using (public.is_member(trip_id));
drop policy if exists "topups write" on public.topups;
create policy "topups write" on public.topups for insert to authenticated with check (public.can_edit(trip_id));
drop policy if exists "topups update" on public.topups;
create policy "topups update" on public.topups for update to authenticated using (public.can_edit(trip_id));
drop policy if exists "topups delete" on public.topups;
create policy "topups delete" on public.topups for delete to authenticated using (public.can_edit(trip_id));

-- 영수증 사진
alter table public.expenses add column if not exists photos text[] not null default '{}';

do $$ begin execute 'alter publication supabase_realtime add table public.topups'; exception when others then null; end $$;
notify pgrst, 'reload schema';
