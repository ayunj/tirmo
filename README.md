# 트리모 trimo

같이 가는 사람들과 일정·경비·준비물·기록을 함께 쓰는 여행 앱.

Next.js (App Router) · Tailwind · Supabase · Vercel

## 지금 되는 것

- 구글 로그인, 닉네임·색 정하기
- 여행 목록 / 새 여행 / 여행 수정·삭제 (해외: 나라·통화·환율, 국내: 도시)
- 초대 링크로 같이 가기
- 일정: 날짜 탭, 타임라인, 이동 방법, 추가·수정·삭제, 실시간 반영

다음: 경비 → 예약 → 준비물 → 위시리스트 → 기록 → PDF

## 처음 설정

### 1. Supabase

1. supabase.com 에서 새 프로젝트 만들기 (Region: Northeast Asia (Seoul))
2. SQL Editor 에 `supabase/migrations/0001_init.sql` 내용을 붙여넣고 Run
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
