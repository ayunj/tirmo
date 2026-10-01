"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MEMBER_COLORS } from "@/lib/places";

type Props = {
  userId: string;
  email: string;
  initialName: string;
  initialColor: string;
  mode: "onboarding" | "edit";
  next?: string;
};

export default function NicknameForm({ userId, email, initialName, initialColor, mode, next = "/" }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor || MEMBER_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const v = name.trim();

  async function save() {
    if (!v) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ nickname: v, color, onboarded: true }).eq("id", userId);
    setBusy(false);
    if (error) return alert("저장하지 못했어요. 다시 시도해 주세요.");
    if (mode === "edit") router.back();
    else router.replace(next);
    router.refresh();
  }

  return (
    <main>
      <header className="hd">
        {mode === "edit" ? (
          <button className="ib" onClick={() => router.back()} aria-label="뒤로">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <span className="w-2" />
        )}
        <h1>{mode === "edit" ? "내 이름" : "이름 정하기"}</h1>
      </header>
      <div className="px-5 pb-10">
        <div className="flex flex-col items-center gap-2.5 pt-6">
          <div
            className="grid h-[84px] w-[84px] place-items-center rounded-full text-[34px] font-extrabold text-white transition-colors"
            style={{ background: color }}
          >
            {v ? [...v][0] : "?"}
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-[13px] text-sub">{email}</div>
        </div>

        <label className="flab">트리모에서 쓸 이름</label>
        <div className="inp flex items-center">
          <input
            className="flex-1 bg-transparent text-[17px] font-semibold outline-none"
            value={name}
            maxLength={10}
            placeholder="이름"
            onChange={(e) => setName(e.target.value)}
          />
          <span className="text-xs text-sub">{[...v].length} / 10</span>
        </div>
        <p className="mt-2 text-[13px] text-sub">같이 가는 사람에게 이 이름으로 보여요</p>

        <label className="flab">내 색</label>
        <div className="flex gap-3">
          {MEMBER_COLORS.map((c) => (
            <button
              key={c}
              aria-label={c}
              onClick={() => setColor(c)}
              className="h-[34px] w-[34px] rounded-full"
              style={{ background: c, boxShadow: c === color ? `0 0 0 2px #fff, 0 0 0 4px #191F28` : undefined }}
            />
          ))}
        </div>

        <button className="btn mt-8" disabled={!v || busy} onClick={save}>
          {mode === "edit" ? "저장" : "시작하기"}
        </button>
      </div>
    </main>
  );
}
