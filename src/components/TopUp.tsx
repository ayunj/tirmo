"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sym } from "@/lib/money";
import { md, today } from "@/lib/format";
import { askDel, toast } from "@/lib/ui";
import Ic from "@/components/Ic";
import Sheet from "@/components/ui/Sheet";
import DatePick from "@/components/ui/DatePick";
import type { Pocket } from "@/lib/types";

const HOW = ["추가 환전", "ATM 인출", "카드 충전", "멤버가 넣음", "남은 돈 옮기기", "기타"];

/** 돈 채우기 버튼 + 창 (목업 topUp) */
export function TopUpButton({ p }: { p: Pocket }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [how, setHow] = useState(HOW[0]);
  const [day, setDay] = useState(today());
  const [rate, setRate] = useState("");
  const [krw, setKrw] = useState("");
  const [memo, setMemo] = useState("");
  const [dp, setDp] = useState(false);
  const s = sym(p.currency).trim();
  const amt = Number(amount.replace(/,/g, "")) || 0;

  async function save() {
    if (!amt) return toast("금액을 적어 주세요");
    const { error } = await createClient()
      .from("topups")
      .insert({ trip_id: p.trip_id, pocket_id: p.id, amount: amt, how, day, rate_text: rate.trim() || null, krw: Number(krw.replace(/[^\d.]/g, "")) || null, memo: memo.trim() || null });
    if (error) return toast("저장하지 못했어요");
    setOpen(false);
    setAmount("");
    toast(`${s}${amt.toLocaleString()} 채웠어요`);
    router.refresh();
  }

  const field = { flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", fontFamily: "inherit" } as const;
  return (
    <>
      <div onClick={() => setOpen(true)}>
        <Ic n="plus" /> 돈 채우기
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={`돈 채우기 · ${p.name}`} id="topUp">
        <div className="amt" style={{ display: "flex", justifyContent: "center", alignItems: "baseline" }}>
          <b>{s}</b>
          <input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" style={{ ...field, flex: "none", width: `${Math.max(1, amount.length) + 0.5}ch`, fontSize: 44, fontWeight: 700, letterSpacing: "-1.5px", marginTop: 10 }} />
        </div>
        <label className="flab">어떻게 채웠어요?</label>
        <div className="rough">
          {HOW.map((h) => (
            <span key={h} className={how === h ? "on" : ""} onClick={() => setHow(h)} style={{ cursor: "pointer" }}>
              {h}
            </span>
          ))}
        </div>
        <div className="form tight">
          <div className="inp row" onClick={() => setDp(true)} style={{ cursor: "pointer" }}>
            <span>
              <Ic n="calendar-days" /> {md(day)}
            </span>
            <span className="sub">날짜</span>
          </div>
          {p.currency !== "KRW" && (
            <>
              <div className="inp row">
                <Ic n="arrow-left-right" />
                <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder={`${s}100 = ₩935`} style={field} />
                <span className="sub">환율 · 선택</span>
              </div>
              <div className="inp row">
                <input value={krw} onChange={(e) => setKrw(e.target.value)} placeholder="₩93,500" inputMode="numeric" style={field} />
                <span className="sub">원화로 · 선택</span>
              </div>
            </>
          )}
          <div className="inp row">
            <Ic n="pencil" />
            <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 · 선택" style={field} />
          </div>
        </div>
        <div className="bigbtn" onClick={save}>
          채우기
        </div>
      </Sheet>
      <DatePick open={dp} onClose={() => setDp(false)} mode="single" a={day} onDone={(a) => a && setDay(a)} />
    </>
  );
}

export function DelTopUp({ id }: { id: string }) {
  const router = useRouter();
  return (
    <span
      className="ib"
      style={{ width: 28, height: 28, fontSize: 15, color: "var(--sub)" }}
      onClick={async () => {
        if (!(await askDel("채운 기록을 지울까요?", undefined, "지우기"))) return;
        await createClient().from("topups").delete().eq("id", id);
        router.refresh();
      }}
    >
      <Ic n="x" />
    </span>
  );
}
