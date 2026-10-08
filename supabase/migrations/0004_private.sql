-- 트리모 4단계: 위시리스트 공유
-- Supabase 대시보드 › SQL Editor 에 통째로 붙여넣고 Run 하면 돼요. 여러 번 돌려도 괜찮아요.

-- 지금까지 넣은 위시는 그대로 같이 보이고(true), 새로 넣는 건 나만 봐요(false)
alter table public.wishes add column if not exists shared boolean not null default true;
alter table public.wishes alter column shared set default false;
