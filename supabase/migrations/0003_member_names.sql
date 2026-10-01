-- 여행 멤버 ↔ 이름(프로필) 연결. 이게 없으면 여행 화면이 열리지 않아요.
do $$ begin
  alter table public.trip_members add constraint trip_members_profile_fk foreign key (user_id) references public.profiles(id) on delete cascade;
exception when duplicate_object then null; end $$;
notify pgrst, 'reload schema';
