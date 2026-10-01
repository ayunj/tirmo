"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES } from "@/lib/places";
import { money, sym, toKrw } from "@/lib/money";
import { askDel, toast } from "@/lib/ui";
import Go from "@/components/Go";
import SaveBar from "@/components/ui/SaveBar";
import Ic, { type IcName } from "@/components/Ic";
import type { Pocket, Trip } from "@/lib/types";

const KINDS: [Pocket["kind"], IcName, string][] = [
  ["cash", "banknote", "현금"],
  ["card", "credit-card", "카드"],
  ["bank", "landmark", "통장"],
];

/** 포켓 만들기 · 고치기 (목업 pocketAdd) */
export default function PocketForm({ trip, me, members, pocket }: { trip: Pick<Trip, "id" | "currency" | "rate" | "rate_unit">; me: string; members: { id: string; nickname: string }[]; pocket?: Pocket }) {
  const router = useRouter();
  const edit = !!pocket;
  const [kind, setKind] = useState<Pocket["kind"]>(pocket?.kind ?? "cash");
  const [shared, setShared] = useState(pocket?.shared ?? false);
  const [owner, setOwner] = useState(pocket?.owner_id ?? me);
  const [name, setName] = useState(pocket?.name ?? "");
  const [cur, setCur] = useState(pocket?.currency ?? trip.currency);
  const [budget, setBudget] = useState(pocket ? String(pocket.budget) : "");
  const [busy, setBusy] = useState(false);
  const snap = JSON.stringify([kind, shared, owner, name, cur, budget]);
  const [snap0] = useState(snap);
  const changed = snap !== snap0;
  const label = KINDS.find((k) => k[0] === kind)![2];
  const amt = Number(budget.replace(/,/g, "")) || 0;
  const curs = Array.from(new Set([trip.currency, "KRW", ...Object.keys(CURRENCIES)]));

  async function save() {
    setBusy(true);
    const row = { trip_id: trip.id, kind, shared, owner_id: shared ? null : owner, name: name.trim() || (shared ? `공동 ${label}` : label), currency: cur, budget: amt };
    const supabase = createClient();
    const { error } = edit ? await supabase.from("pockets").update(row).eq("id", pocket!.id) : await supabase.from("pockets").insert(row);
    setBusy(false);
    if (error) return toast("저장하지 못했어요");
    router.replace(edit ? `/trips/${trip.id}/money/pocket/${pocket!.id}` : `/trips/${trip.id}/money`);
    router.refresh();
  }

  async function remove() {
    if (!pocket || !(await askDel(`${pocket.name} 포켓을 지울까요?`, "이 포켓으로 쓴 지출 기록은 남아요"))) return;
    const { error } = await createClient().from("pockets").delete().eq("id", pocket.id);
    if (error) return toast("지우지 못했어요");
    toast("포켓을 지웠어요");
    router.replace(`/trips/${trip.id}/money`);
    router.refresh();
  }

  return (
    <section className="screen on hasbar" id="pocketAdd">
      <div className="scr nonav">
        <div className="hd">
          <Go as="span" className="ib" back>
            <Ic n="x" />
          </Go>
          <h2>{edit ? "포켓 수정" : "포켓 만들기"}</h2>
        </div>
        <div className="pad">
          <div className="typeg three">
            {KINDS.map(([k, n, l]) => (
              <div key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
                <Ic n={n} />
                <span>{l}</span>
              </div>
            ))}
          </div>
          {members.length > 1 && (
            <div className="switches">
              <div onClick={() => setShared(!shared)} style={{ cursor: "pointer" }}>
                <Ic n="users" />
                <span>공동경비로 쓰기</span>
                <i className={`sw${shared ? " on" : ""}`} />
              </div>
            </div>
          )}
          <div className="form">
            {!shared && members.length > 1 && (
              <>
                <label>누구 거예요?</label>
                <div className="chips flush" style={{ marginTop: 0 }}>
                  {members.map((m) => (
                    <span key={m.id} className={`chip${owner === m.id ? " on" : ""}`} onClick={() => setOwner(m.id)}>
                      {m.id === me ? "나" : m.nickname}
                    </span>
                  ))}
                </div>
              </>
            )}
            <label>이름</label>
            <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder={shared ? `공동 ${label}` : kind === "card" ? "트래블카드" : label} />
            <label>통화</label>
            <div className="inp row" style={{ position: "relative" }}>
              <span>
                {cur} {CURRENCIES[cur]?.name ?? ""}
              </span>
              <Ic n="chevron-right" />
              <select value={cur} onChange={(e) => setCur(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}>
                {curs.map((c) => (
                  <option key={c} value={c}>
                    {c} {CURRENCIES[c]?.name ?? ""}
                  </option>
                ))}
              </select>
            </div>
            <label>{kind === "cash" ? "예산 (환전한 금액)" : kind === "card" ? "예산 (충전한 금액)" : "예산 · 없으면 비워 둬요"}</label>
            <div className="inp row">
              <span style={{ display: "flex", alignItems: "baseline", gap: 2, flex: 1 }}>
                <b style={{ fontSize: 20 }}>{sym(cur).trim()}</b>
                <input inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", fontSize: 20, fontWeight: 700, fontFamily: "inherit" }} />
              </span>
              {cur !== "KRW" && amt > 0 && <span className="sub">≈ {money(toKrw(amt, cur, trip), "₩")}</span>}
            </div>
            {shared && members.length > 1 && amt > 0 && (
              <div className="sub" style={{ marginTop: 8 }}>
                1인 {money(amt / members.length, sym(cur))}씩 모아요
              </div>
            )}
          </div>
          {edit && (
            <div className="dellink" onClick={remove}>
              <Ic n="trash" /> 포켓 삭제
            </div>
          )}
        </div>
      </div>
      <SaveBar on={!pocket || changed} busy={busy} onSave={save} />
    </section>
  );
}
