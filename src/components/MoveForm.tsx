"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normTime } from "@/lib/format";
import { evCat, MOVE_LABEL } from "@/lib/cats";
import { sym } from "@/lib/money";
import { toast } from "@/lib/ui";
import Go from "@/components/Go";
import Ic, { type IcName } from "@/components/Ic";
import type { EventRow, Pocket } from "@/lib/types";

const MODES: [string, IcName, string][] = [
  ["flight", "plane", "비행기"],
  ["walk", "footprints", "도보"],
  ["transit", "train-front", "대중교통"],
  ["taxi", "car-taxi-front", "택시"],
  ["car", "car", "차"],
];

/** move_note '14분 · ¥1,900 · 메모' 를 칸별로 */
function split(note: string | null) {
  const out = { dur: "", fare: "", won: false, memo: [] as string[] };
  for (const p of (note ?? "").split("·").map((x) => x.trim()).filter(Boolean)) {
    if (!out.fare && /[₩¥$€฿₫]|원$|엔$/.test(p)) {
      out.fare = p.replace(/[^\d.]/g, "");
      out.won = /₩|원$/.test(p);
    }
    else if (!out.dur && /(\d+\s*(분|시간|h|m))/.test(p)) out.dur = p;
    else out.memo.push(p);
  }
  return { ...out, memo: out.memo.join(" · ") };
}

type Props = { ev: EventRow; prev: Pick<EventRow, "title" | "time_text" | "category"> | null; currency: string; pockets: Pocket[]; me: string };

/** 이동 방법 (목업 move) */
export default function MoveForm({ ev, prev, currency, pockets, me }: Props) {
  const router = useRouter();
  const init = split(ev.move_note);
  const [mode, setMode] = useState(ev.move_mode ?? "");
  const [dur, setDur] = useState(init.dur);
  const [fare, setFare] = useState(init.fare);
  const [cur, setCur] = useState(init.won ? "KRW" : currency);
  const [memo, setMemo] = useState(init.memo);
  const shared = pockets.find((p) => p.shared && p.currency === currency) ?? pockets.find((p) => p.shared);
  const [rec, setRec] = useState(!init.fare);
  const [pk, setPk] = useState(shared?.id ?? "");
  const [busy, setBusy] = useState(false);
  const s = sym(cur).trim();
  const curs = Array.from(new Set([currency, "KRW"]));
  const amt = Number(fare.replace(/[^\d.]/g, "")) || 0;

  async function save() {
    setBusy(true);
    const note = [dur.trim(), amt ? `${s}${amt.toLocaleString()}` : "", memo.trim()].filter(Boolean).join(" · ");
    const supabase = createClient();
    const { error } = await supabase.from("events").update({ move_mode: mode || null, move_note: note || null }).eq("id", ev.id);
    if (error) {
      setBusy(false);
      return toast("저장하지 못했어요");
    }
    if (rec && amt && !init.fare) {
      const p = pockets.find((x) => x.id === pk && x.currency === cur);
      await supabase.from("expenses").insert({
        trip_id: ev.trip_id,
        pocket_id: p?.id ?? null,
        payer_id: p?.shared ? null : p?.owner_id ?? me,
        amount: amt,
        currency: cur,
        category: "교통",
        title: `${MOVE_LABEL[mode] ?? "이동"} · ${ev.title}`,
        day: ev.day,
        time_text: ev.time_text,
      });
      toast("경비에도 넣었어요");
    }
    router.replace(`/trips/${ev.trip_id}/plan?day=${ev.day ?? "none"}`);
    router.refresh();
  }

  return (
    <section className="screen on" id="move">
      <div className="scr nonav">
        <div className="hd">
          <Go as="span" className="ib" back>
            <Ic n="x" />
          </Go>
          <h2>이동 방법</h2>
          <span className={`txtbtn${busy ? " off" : ""}`} onClick={save}>
            완료
          </span>
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          <div className="fromto">
            {prev && (
              <>
                <div>
                  <i className="dotc" style={{ background: `var(--${{ acc: "acc", amberc: "amber", shopc: "violet" }[evCat(prev.category).dot] ?? evCat(prev.category).dot})` }} />
                  <div>
                    <b>{prev.title}</b>
                    <span>{normTime(prev.time_text)}</span>
                  </div>
                </div>
                <div className="line" />
              </>
            )}
            <div>
              <i className="dotc" style={{ background: `var(--${{ acc: "acc", amberc: "amber", shopc: "violet" }[evCat(ev.category).dot] ?? evCat(ev.category).dot})` }} />
              <div>
                <b>{ev.title}</b>
                <span>{normTime(ev.time_text)}</span>
              </div>
            </div>
          </div>
          <label className="flab">어떻게 가요?</label>
          <div className="modelist">
            {MODES.map(([k, n, l]) => (
              <div key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)} style={{ cursor: "pointer" }}>
                <Ic n={n} />
                <div className="mid">
                  <b>{l}</b>
                </div>
                <i className="rd" />
              </div>
            ))}
          </div>
          <div className="form tight">
            <div className="inp row">
              <span style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
                <Ic n="clock-3" /> 이동 시간
              </span>
              <input className="mvin" value={dur} onChange={(e) => setDur(e.target.value)} placeholder={mode === "flight" ? "1시간 30분" : "14분"} style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", textAlign: "right", fontWeight: 700 }} />
            </div>
            <div className="inp row">
              <span style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
                <Ic n="banknote" /> 요금
              </span>
              {curs.length > 1 && (
                <span className="curtg" style={{ flex: "none", marginLeft: 4 }}>
                  {curs.map((c) => (
                    <span key={c} className={cur === c ? "on" : ""} onClick={() => setCur(c)} style={{ cursor: "pointer", padding: "4px 10px" }}>
                      {sym(c).trim()}
                    </span>
                  ))}
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, justifyContent: "flex-end", fontWeight: 700 }}>
                {s}
                <input className="mvin" inputMode="decimal" value={fare} onChange={(e) => setFare(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" style={{ width: `${Math.max(1, fare.length) + 1}ch`, border: 0, outline: 0, background: "none", textAlign: "right", fontWeight: 700 }} />
              </span>
            </div>
            <div className="inp row">
              <Ic n="pencil" />
              <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 · 예) 캐리어 때문에 택시" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none" }} />
            </div>
          </div>
          {!init.fare && amt > 0 && (
            <>
              <div className="switches">
                <div onClick={() => setRec(!rec)} style={{ cursor: "pointer" }}>
                  <Ic n="receipt" />
                  <span>요금을 경비에 기록</span>
                  <i className={`sw${rec ? " on" : ""}`} />
                </div>
              </div>
              {rec && (
                <div className="chips flush">
                  <span className={`chip${!pockets.some((p) => p.id === pk && p.currency === cur) ? " on" : ""}`} onClick={() => setPk("")}>
                    내가 냄
                  </span>
                  {pockets
                    .filter((p) => p.currency === cur)
                    .map((p) => (
                      <span key={p.id} className={`chip${pk === p.id ? " on" : ""}`} onClick={() => setPk(p.id)}>
                        {p.name}
                      </span>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
