"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Ic from "@/components/Ic";
import { toast } from "@/lib/ui";
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
    if (error) return toast("저장하지 못했어요");
    if (mode === "edit") router.back();
    else router.replace(next);
    router.refresh();
  }

  return (
    <section className={`screen on${mode === "edit" ? " editmode" : ""}`} id="nickname">
      <div className="scr nonav">
        <div className="hd">
          {mode === "edit" && (
            <span className="ib nk-back" onClick={() => router.back()}>
              <Ic n="chevron-left" />
            </span>
          )}
          <h2 id="nkH">{mode === "edit" ? "내 이름" : "이름 정하기"}</h2>
        </div>
        <div className="pad">
          <div className="nk-top">
            <div className="nk-av" id="nkAv" style={{ background: color }}>
              {v ? [...v][0] : "?"}
            </div>
            <div className="nk-acc">
              <span className="g">G</span>
              {email}
            </div>
          </div>
          <label className="flab">트리모에서 쓸 이름</label>
          <div className="inp wi-f nk-in">
            <input value={name} maxLength={10} placeholder="이름" onChange={(e) => setName(e.target.value)} style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", fontFamily: "inherit", fontSize: 17, fontWeight: 600 }} />
            <em id="nkC">{[...v].length} / 10</em>
          </div>
          <div className="sub" style={{ marginTop: 8 }}>
            같이 가는 사람에게 이 이름으로 보여요
          </div>
          <label className="flab">내 색</label>
          <div className="nk-cols" id="nkCols">
            {MEMBER_COLORS.map((c) => (
              <i key={c} className={c === color ? "on" : ""} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
          <div className="bigbtn" id="nkGo" style={{ marginTop: 26, opacity: !v || busy ? 0.5 : 1 }} onClick={() => v && !busy && save()}>
            {mode === "edit" ? "저장" : "시작하기"}
          </div>
        </div>
      </div>
    </section>
  );
}
