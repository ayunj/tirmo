;

with t as (
  select id from public.trips
  where start_date = '2026-10-10' and end_date = '2026-10-12'
  order by created_at desc limit 1
),
v(day, time_text, sort, title, category, memo, move_mode, move_note) as (values
  ('2026-10-10'::date, '07:30', 450, '집에서 출발', '교통', null, null, null),
  ('2026-10-10', null, 600, '공항에서 밥 먹기', '음식점', '면세품 찾기', 'car', '제1터미널 제주항공'),
  ('2026-10-10', null, 855, '텐진역 도착', '교통', null, 'transit',
   E'30분 · 국제선에서 버스 (1인 500엔 / 교통카드 480엔)\n12:40 → 13:10 ✕ 비행기 도착시간이라 사실상 불가능\n13:25 → 13:55 △ 입국심사가 빨리 끝나면 가능\n13:45 → 14:15 ⭐ 가장 현실적\n14:35 → 15:05 여유 있게 이동'),
  ('2026-10-10', null, 920, '점심 · 신신라멘', '음식점', null, null, null),
  ('2026-10-10', null, 960, '텐진 지하상가', '쇼핑', E'이모야킨지로 고구마스틱\n네추럴키친\nEAST table ワン・フクオカ・ビル店\n요시다포터', null, null),
  ('2026-10-10', null, 990, '미나텐진', '쇼핑', E'GU\n유니클로', null, null),
  ('2026-10-10', null, 1020, '몽벨 텐진점', '쇼핑', '텐진점 면세 X', null, null),
  ('2026-10-10', null, 1050, '로프트', '쇼핑', null, null, null),
  ('2026-10-10', '19:00', 1140, '저녁 · 스시사카바 사시미노사시스', '음식점', E'7~8시\nすし酒場 さしみのさしす', null, null),
  ('2026-10-10', null, 1230, '숙소에 짐 두고 나오기', '숙소', null, null, null),
  ('2026-10-10', null, 1260, '나카스강 구경', '관광지', null, null, null),
  ('2026-10-10', null, 1290, '바 린사스', '음식점', null, null, null),
  ('2026-10-10', null, 1320, '호텔', '숙소', null, null, null),

  ('2026-10-11', null, 480, '아침 · 편의점', '음식점', null, null, null),
  ('2026-10-11', null, 720, '점심 · 함바그 or 우오츄', '음식점', null, null, null),
  ('2026-10-11', null, 840, '카페', '카페', null, null, null),
  ('2026-10-11', null, 900, '하카타 다이소', '쇼핑', null, null, null),
  ('2026-10-11', null, 930, '스탠다드프로덕트', '쇼핑', null, null, null),
  ('2026-10-11', null, 960, '도큐핸즈', '쇼핑', null, null, null),
  ('2026-10-11', '18:00', 1080, '저녁 · 모츠나베', '음식점', null, null, null),
  ('2026-10-11', null, 1170, '돈키호테', '쇼핑', null, null, null),
  ('2026-10-11', null, 1230, '신지다이 텐진점', '음식점', null, null, null),
  ('2026-10-11', null, 1320, '호텔', '숙소', null, null, null),

  ('2026-10-12', '08:40', 520, '체크아웃', '숙소', '캐리어 프런트에 보관 · 08:50 호텔 출발', null, null),
  ('2026-10-12', '09:00', 540, '오니기리 고리짱 텐진', '음식점', '아침 · 09:00~09:35', 'walk', '10분'),
  ('2026-10-12', '09:50', 590, '니시테츠 후쿠오카(텐진)역 탑승', '교통', '09:50~10:00 전후 니시테츠 전철', 'walk', '15분'),
  ('2026-10-12', '10:30', 630, '다자이후 참배길 구경', '관광지', '다자이후역 10:30 전후 도착 · 10:30~11:00 천천히', 'transit', '40분 · 니시테츠 전철'),
  ('2026-10-12', '11:00', 660, '다자이후 텐만구', '관광지', '11:00~12:05', 'walk', null),
  ('2026-10-12', '12:05', 725, '카사노야 우메가에모치', '카페', '12:05~12:25', 'walk', null),
  ('2026-10-12', '12:25', 745, '참배길 상점 · 기념품', '쇼핑', '12:25~12:50', 'walk', null),
  ('2026-10-12', '13:00', 780, '점심 · 우나기 노 나루세 장어덮밥', '음식점', E'13:00~14:00\n우나기 노 나루세 다자이후 텐만 미야마에텐', 'walk', null),
  ('2026-10-12', '14:05', 845, 'coba cafe', '카페', '14:05~15:10', 'walk', null),
  ('2026-10-12', '15:10', 910, '참배길 마지막 쇼핑 · 사진', '쇼핑', '15:10~15:35', 'walk', null),
  ('2026-10-12', '15:51', 951, '⭐ 다자이후 → 텐진 출발', '교통', '15:35~15:40 다자이후역으로 이동', 'walk', '5분'),
  ('2026-10-12', '16:40', 1000, '호텔 도착 · 짐 찾기', '숙소', '맡긴 짐 수령 + 택시 호출 (16:40~17:00)', 'transit', E'45분 · 16:25~16:35 텐진역 도착 예상'),
  ('2026-10-12', '17:00', 1020, '공항 국제선으로 택시 출발', '교통', null, null, null),
  ('2026-10-12', '17:20', 1040, '⭐ 후쿠오카공항 국제선 도착', '교통', '17:20~17:30 도착 목표 (늦어도 17:40)', 'taxi', '20~30분'),
  ('2026-10-12', '19:50', 1190, '후쿠오카 출발', '교통', '제주항공 7C1408 → 인천', null, null),
  ('2026-10-12', '21:20', 1280, '인천 도착', '교통', null, 'flight', '1시간 30분')
)
insert into public.events (trip_id, day, time_text, sort, title, category, memo, move_mode, move_note)
select t.id, v.day, v.time_text, v.sort + random() / 100, v.title, v.category, v.memo, v.move_mode, v.move_note
from t, v
where not exists (
  select 1 from public.events e
  where e.trip_id = t.id and e.day = v.day
    and (e.title = v.title or (v.time_text is not null and e.time_text = v.time_text))
);

update public.events e set move_mode = 'walk', move_note = '10분 · 텐진역에서 도보 8~10분'
from public.trips t
where e.trip_id = t.id and t.start_date = '2026-10-10' and t.end_date = '2026-10-12'
  and e.day = '2026-10-10' and e.title = '호텔 체크인' and e.move_mode is null;

select e.day, e.time_text, e.title from public.events e join public.trips t on t.id = e.trip_id
where t.start_date = '2026-10-10' and t.end_date = '2026-10-12'
order by e.day, e.sort;
