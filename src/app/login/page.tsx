"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [busy, setBusy] = useState(false);
  const err = params.get("error");

  async function google() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <main className="flex min-h-dvh flex-col bg-white px-6">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="text-[52px] font-extrabold tracking-tight">
          tri<span className="text-sky">mo</span>
        </div>
        <p className="mt-1 text-sm text-sub">여행 메모, 트리모</p>
        <button
          onClick={google}
          disabled={busy}
          className="mt-12 flex w-full items-center justify-center gap-2.5 rounded-2xl border border-line bg-white py-4 text-[15.5px] font-bold disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          {busy ? "구글로 이동 중…" : "Google로 계속하기"}
        </button>
        {err && <p className="mt-4 text-sm text-red">로그인하지 못했어요. 다시 시도해 주세요.</p>}
        {next.startsWith("/join/") && <p className="mt-4 text-sm text-sky-d">로그인하면 초대받은 여행으로 바로 가요</p>}
      </div>
      <p className="pb-8 text-center text-xs text-sub">계속하면 이용약관과 개인정보처리방침에 동의하게 돼요.</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
