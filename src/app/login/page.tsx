"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/ui";

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [busy, setBusy] = useState(false);
  const err = params.get("error");
  const invited = next.startsWith("/join/");

  async function google() {
    setBusy(true);
    await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <section className="screen on" id="login">
      <div className="scr full nonav login2">
        <div className="lg-box">
          <div className="lg-logo">
            tri<b>mo</b>
          </div>
          <p>여행 메모, 트리모</p>
          <div className="gbtn" onClick={() => !busy && google()} style={{ opacity: busy ? 0.6 : 1 }}>
            <span className="g">G</span>
            {busy ? "구글로 이동 중…" : "Google로 계속하기"}
          </div>
          {err && <p style={{ color: "var(--red, #E5574A)", marginTop: 14 }}>로그인하지 못했어요. 다시 시도해 주세요.</p>}
          <div className="lg-inv" onClick={() => toast(invited ? "로그인하면 초대받은 여행으로 바로 가요" : "받은 초대 링크를 눌러서 들어오면 돼요")}>
            {invited ? "로그인하면 초대받은 여행으로 가요" : "초대 링크를 받으셨나요?"}
          </div>
        </div>
        <div className="lg-f">
          계속하면 이용약관과{" "}
          <a href="/privacy" style={{ textDecoration: "underline" }}>
            개인정보처리방침
          </a>
          에 동의하게 돼요.
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
