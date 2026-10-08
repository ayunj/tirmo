-- 트리모 5단계: 일정 하나에 예약 · 위시 여러 개 연결
-- Supabase 대시보드 › SQL Editor 에 통째로 붙여넣고 Run 하면 돼요. 여러 번 돌려도 괜찮아요.
alter table public.events add column if not exists booking_ids uuid[] not null default '{}';
alter table public.events add column if not exists wish_ids uuid[] not null default '{}';

-- 지금까지 하나씩 연결한 것 옮기기
update public.events set booking_ids = array[booking_id] where booking_id is not null and cardinality(booking_ids) = 0;
update public.events set wish_ids = array[wish_id] where wish_id is not null and cardinality(wish_ids) = 0;
