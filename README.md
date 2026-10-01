# 트리모 trimo

같이 가는 사람들과 일정·경비·준비물·기록을 함께 쓰는 여행 앱.

Next.js (App Router) · Tailwind · Supabase · Vercel

## 지금 되는 것

- 구글 로그인, 닉네임·색
- 여행 목록 · 새 여행 (달력, 나라·도시, 통화·환율, 커버 색·사진) · 초대 링크
- 일정: 타임라인, 이동 방법, 순서 넣기, 예약·가고싶은곳 연결, 상세에서 바로 고치기
- 예약: 항공·숙소·렌터카·식당·투어·기타, 탑승권·바우처 캡처, 일정·경비·준비물 자동 연결
- 경비: 포켓(현금·카드·통장·공동), 돈 채우기, 내역·통계, 나눠 내기, 정산
- 준비물 · 위시리스트(가고싶은곳 · 쇼핑) · 여행 기록(사진, 감정, 날씨)

다음: PDF 여행책

## 처음 설정

### 1. Supabase

1. supabase.com 에서 새 프로젝트 만들기 (Region: Northeast Asia (Seoul))
2. SQL Editor 에 `supabase/migrations/` 의 파일을 번호 순서대로(0001 → 0002 → 0003) 하나씩 붙여넣고 Run
3. Project Settings > API 에서 **Project URL**, **anon public key** 복사

> `service_role` 키는 어디에도 붙여넣지 마세요. 앱에서 쓰지 않아요.

### 2. 구글 로그인

1. console.cloud.google.com > API 및 서비스 > 사용자 인증 정보 > OAuth 클라이언트 ID 만들기 (웹 애플리케이션)
2. 승인된 리디렉션 URI: `https://<프로젝트>.supabase.co/auth/v1/callback`
3. 받은 Client ID / Secret 을 Supabase > Authentication > Sign In / Providers > Google 에 넣고 켜기
4. Supabase > Authentication > URL Configuration
   - Site URL: `https://<vercel 주소>`
   - Redirect URLs: `https://<vercel 주소>/auth/callback`, `http://localhost:3000/auth/callback`

### 3. Vercel

1. vercel.com > Add New Project > 이 저장소 Import
2. Environment Variables 에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
3. Deploy

## 로컬 실행

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev
```
