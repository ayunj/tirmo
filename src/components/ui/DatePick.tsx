"use client";

import { useState } from "react";
import Sheet from "@/components/ui/Sheet";
import Ic from "@/components/Ic";

const WK = ["일", "월", "화", "수", "목", "금", "토"];
const p2 = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${p2(m + 1)}-${p2(d)}`;
const obj = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fmt = (s: string) => {
  const t = obj(s);
  return `${t.getMonth() + 1}/${t.getDate()} (${WK[t.getDay()]})`;
};

/** 목업 날짜 창: 여행 날짜(범위) 또는 하루 */
export default function DatePick({
  open,
  onClose,
  mode,
  a,
  b,
  time,
  withTime,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  mode: "range" | "single";
  a?: string | null;
  b?: string | null;
  time?: string;
  withTime?: boolean;
  onDone: (a: string | null, b: string | null, time: string) => void;
}) {
  const [A, setA] = useState<string | null>(a ?? null);
  const [B, setB] = useState<string | null>(b ?? null);
  const [T, setT] = useState(time ?? "");
  const [was, setWas] = useState(false);
  if (open && !was) {
    setWas(true);
    setA(a ?? null);
    setB(b ?? null);
    setT(time ?? "");
  }
  if (!open && was) setWas(false);

  const now = new Date();
  const base = A ? obj(A) : now;
  const start = new Date(Math.min(base.getTime(), now.getTime()));
  const months = Array.from({ length: 14 }, (_, i) => new Date(start.getFullYear(), start.getMonth() + i, 1));

  function pick(d: string) {
    if (mode === "single") return setA(d);
    if (!A || B || d < A) {
      setA(d);
      setB(null);
    } else setB(d);
  }

  const n = A && B ? Math.round((obj(B).getTime() - obj(A).getTime()) / 864e5) : 0;
  return (
    <Sheet open={open} onClose={onClose} title={mode === "range" ? "여행 날짜" : "날짜"} id="datePick" className={mode === "single" ? "single" : ""}>
      <>
        <div className="dp-sum">
          {mode === "range" ? (
            A && B ? (
              <>
                <b>
                  {fmt(A)} – {fmt(B)}
                </b>
                <span>
                  {n}박 {n + 1}일
                </span>
              </>
            ) : A ? (
              <>
                <b>{fmt(A)} – </b>
                <span>오는 날을 골라요</span>
              </>
            ) : (
              <span>가는 날을 골라요</span>
            )
          ) : A ? (
            <b>{fmt(A)}</b>
          ) : (
            <span>날짜를 골라요</span>
          )}
        </div>
        <div className="cal">
          {months.map((m) => {
            const y = m.getFullYear();
            const mo = m.getMonth();
            const first = m.getDay();
            const days = new Date(y, mo + 1, 0).getDate();
            return (
              <div className="cal-m" key={`${y}-${mo}`}>
                <b>
                  {y}년 {mo + 1}월
                </b>
                <div className="cal-g">
                  {WK.map((w, i) => (
                    <span key={w} className={`wk${i === 0 ? " sun" : ""}${i === 6 ? " sat" : ""}`}>
                      {w}
                    </span>
                  ))}
                  {Array.from({ length: first }).map((_, i) => (
                    <span key={`e${i}`} />
                  ))}
                  {Array.from({ length: days }).map((_, i) => {
                    const d = i + 1;
                    const s = iso(y, mo, d);
                    const dow = (first + i) % 7;
                    const cls = ["cd", dow === 0 && "sun", dow === 6 && "sat", A === s && "st", A === s && B && B !== A && "r", B === s && "en", B === s && A && "l", A && B && s > A && s < B && "rng"].filter(Boolean).join(" ");
                    return (
                      <button key={s} className={cls} onClick={() => pick(s)}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {withTime && (
          <div className="dp-time">
            <label className="flab">
              시간{" "}
              <span className="sub" style={{ fontWeight: 500 }}>
                선택
              </span>
            </label>
            <div className="inp row tin tinput">
              <Ic n="clock-3" />
              <input className="tedit" value={T} onChange={(e) => setT(e.target.value)} placeholder="예) 15:00" inputMode="numeric" style={{ border: 0, outline: 0, background: "none", flex: 1 }} />
            </div>
          </div>
        )}
        <div
          className="bigbtn"
          style={{ opacity: mode === "range" && A && !B ? 0.5 : 1 }}
          onClick={() => {
            if (mode === "range" && A && !B) return;
            onDone(A, mode === "range" ? B : null, T);
            onClose();
          }}
        >
          완료
        </div>
      </>
    </Sheet>
  );
}
