"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES } from "@/lib/places";
import { POCKET_KINDS, money, sym, toKrw } from "@/lib/money";
import { POCKET_ICON } from "@/components/icons";
import FormHeader from "@/components/ui/FormHeader";
import type { Pocket, Trip } from "@/lib/types";

type Props = {
  trip: Pick<Trip, "id" | "currency" | "rate" | "rate_unit">;
  me: string;
  members: { id: string; nickname: string }[];
  pocket?: Pocket;
};

export default function PocketForm({ trip, me, members, pocket }: Props) {
  const router = useRouter();
  const edit = !!pocket;
  const [kind, setKind] = useState<Pocket["kind"]>(pocket?.kind ?? "cash");
  const [shared, setShared] = useState(pocket?.shared ?? false);
  const [owner, setOwner] = useState(pocket?.owner_id ?? me);
  const [name, setName] = useState(pocket?.name ?? "");
  const [cur, setCur] = useState(pocket?.currency ?? trip.currency);
  const [budget, setBudget] = useState(pocket ? String(pocket.budget) : "");
  const [busy, setBusy] = useState(false);
  const label = POCKET_KINDS.find((k) => k.key === kind)!.label;
  const amt = Number(budget.replace(/,/g, "")) || 0;
  const curs = Array.from(new Set([trip.currency, "KRW", ...Object.keys(CURRENCIES)]));
  const back = `/trips/${trip.id}/money`;

  async function save() {
    setBusy(true);
    const row = {
      trip_id: trip.id,
      kind,
      shared,
      owner_id: shared ? null : owner,
      name: name.trim() || (shared ? `공동 ${label}` : label),
      currency: cur,
      budget: amt,
    };
    const supabase = createClient();
    const { error } = edit ? await supabase.from("pockets").update(row).eq("id", pocket!.id) : await supabase.from("pockets").insert(row);
    setBusy(false);
    if (error) return alert("저장하지 못했어요");
    router.replace(back);
    router.refresh();
  }

  async function remove() {
    if (!pocket || !confirm("이 포켓을 지울까요? 쓴 내역은 남아 있어요.")) return;
    const { error } = await createClient().from("pockets").delete().eq("id", pocket.id);
    if (error) return alert("지우지 못했어요");
    router.replace(back);
    router.refresh();
  }

  return (
    <main className="pb-10">
      <FormHeader title={edit ? "포켓" : "포켓 만들기"} onSave={save} busy={busy} />
      <div className="px-5">
        <div className="mt-3 grid grid-cols-3 gap-2">
          {POCKET_KINDS.map((k) => {
            const I = POCKET_ICON[k.key];
            return (
              <button
                key={k.key}
                onClick={() => setKind(k.key)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-[1.5px] bg-white py-3.5 text-[13px] font-bold ${kind === k.key ? "border-char text-ink" : "border-line text-ink2"}`}
              >
                <I size={20} />
                {k.label}
              </button>
            );
          })}
        </div>

        {members.length > 1 && (
          <label className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-[15px]">
            <Users size={19} className="text-ink2" />
            <span className="flex-1">공동경비로 쓰기</span>
            <input type="checkbox" className="h-5 w-5 accent-[#4B4E56]" checked={shared} onChange={(e) => setShared(e.target.checked)} />
          </label>
        )}
        {!shared && members.length > 1 && (
          <>
            <label className="flab">누구 거예요?</label>
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => (
                <button key={m.id} className={`chip ${owner === m.id ? "on" : ""}`} onClick={() => setOwner(m.id)}>
                  {m.id === me ? "나" : m.nickname}
                </button>
              ))}
            </div>
          </>
        )}

        <label className="flab">이름</label>
        <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder={shared ? `공동 ${label}` : kind === "card" ? "예) 트래블카드" : label} />

        <label className="flab">통화</label>
        <select className="inp appearance-none" value={cur} onChange={(e) => setCur(e.target.value)}>
          {curs.map((c) => (
            <option key={c} value={c}>
              {c} {CURRENCIES[c]?.name ?? ""}
            </option>
          ))}
        </select>

        <label className="flab">{kind === "cash" ? "예산 (환전한 금액)" : "예산 (충전 · 한도)"}</label>
        <div className="flex items-center rounded-[14px] border-[1.5px] border-line bg-white px-4">
          <b className="text-[19px]">{sym(cur).trim()}</b>
          <input className="min-w-0 flex-1 bg-transparent px-1 py-3.5 text-[19px] font-bold outline-none" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" />
          {cur !== "KRW" && amt > 0 && <span className="text-[13px] text-sub">≈ {money(toKrw(amt, cur, trip), "₩")}</span>}
        </div>
        {shared && members.length > 1 && amt > 0 && <p className="mt-2 text-[13px] text-sub">1인 {money(amt / members.length, sym(cur))}씩 모아요</p>}

        {edit && (
          <button className="dellink w-full" onClick={remove}>
            <Trash2 size={16} /> 포켓 삭제
          </button>
        )}
      </div>
    </main>
  );
}
