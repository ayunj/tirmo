"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Link2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PACK_TEMPLATE } from "@/lib/pack";
import type { PackItem } from "@/lib/types";

type Who = Record<string, { nickname: string; color: string }>;

export default function PackList({ tripId, items, cats, who, dleft }: { tripId: string; items: PackItem[]; cats: string[]; who: Who; dleft: string }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [filter, setFilter] = useState("전체");
  const [seeding, setSeeding] = useState(false);
  const [prev, setPrev] = useState(items);
  if (items !== prev) {
    setPrev(items);
    setList(items);
  }

  const done = list.filter((i) => i.done).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;
  const shown = filter === "전체" ? cats : [filter];

  async function toggle(it: PackItem) {
    setList((l) => l.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)));
    const { error } = await createClient().from("pack_items").update({ done: !it.done }).eq("id", it.id);
    if (error) {
      alert("저장하지 못했어요");
      router.refresh();
    }
  }

  async function seed() {
    setSeeding(true);
    const rows = Object.entries(PACK_TEMPLATE).flatMap(([category, names]) => names.map((name, i) => ({ trip_id: tripId, category, name, sort: i })));
    await createClient().from("pack_items").insert(rows);
    setSeeding(false);
    router.refresh();
  }

  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <div className="px-4 pt-2.5">
      <section className="card flex items-center gap-4 p-5">
        <div className="relative h-[84px] w-[84px] flex-none">
          <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
            <circle cx="42" cy="42" r={R} fill="none" stroke="#eaf4ff" strokeWidth="9" />
            <circle cx="42" cy="42" r={R} fill="none" stroke="#4da3ff" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
          </svg>
          <b className="absolute inset-0 grid place-items-center text-[17px]">{pct}%</b>
        </div>
        <div>
          <b className="block text-[19px] font-extrabold tracking-tight">{list.length ? `${done}개 챙겼어요` : "준비물을 적어 봐요"}</b>
          <span className="s13">
            {list.length ? `${list.length - done}개 남음` : ""}
            {dleft ? `${list.length ? " · " : ""}${dleft}` : ""}
          </span>
        </div>
      </section>

      {list.length === 0 ? (
        <button className="btn mt-4" onClick={seed} disabled={seeding}>
          {seeding ? "넣는 중…" : "기본 목록으로 시작하기"}
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["전체", ...cats].map((c) => (
            <button key={c} className={`chip ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      {shown.map((cat) => {
        const rows = list.filter((i) => i.category === cat);
        if (!rows.length && filter === "전체") return null;
        return (
          <section key={cat} className="card mt-3 px-4 pb-1 pt-3.5">
            <div className="flex items-center justify-between pb-1">
              <b className="text-[16px]">{cat}</b>
              <span className="text-[12.5px] font-bold text-sub">
                {rows.filter((r) => r.done).length} / {rows.length}
              </span>
            </div>
            {rows.map((it) => (
              <div key={it.id} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
                <button
                  onClick={() => toggle(it)}
                  aria-label={it.done ? "안 챙김으로" : "챙김"}
                  className={`grid h-[22px] w-[22px] flex-none place-items-center rounded-md border-[1.5px] ${it.done ? "border-char bg-char text-white" : "border-[#c6cad1] bg-white"}`}
                >
                  {it.done && <Check size={15} strokeWidth={3} />}
                </button>
                <Link href={`/trips/${tripId}/pack/${it.id}`} className="min-w-0 flex-1">
                  <span className={`block text-[15px] ${it.done ? "text-sub" : ""}`}>{it.name}</span>
                  {it.memo && <span className="block truncate text-[12.5px] text-sub">{it.memo}</span>}
                </Link>
                {it.assignee && who[it.assignee] && (
                  <span className="pill !h-[22px] !px-2 !text-[11.5px]" style={{ background: who[it.assignee].color }}>
                    {who[it.assignee].nickname}
                  </span>
                )}
                {it.booking_id && (
                  <Link href={`/trips/${tripId}/bookings/${it.booking_id}`} className="flex flex-none items-center gap-0.5 rounded-md bg-bg px-1.5 py-0.5 text-[11.5px] font-bold text-ink2">
                    <Link2 size={12} /> 예약
                  </Link>
                )}
              </div>
            ))}
            {filter !== "전체" && rows.length === 0 && <p className="py-4 text-center text-sm text-sub">비어 있어요</p>}
          </section>
        );
      })}

      <Link href={`/trips/${tripId}/pack/new${filter !== "전체" ? `?cat=${encodeURIComponent(filter)}` : ""}`} className="addline mt-3">
        <Plus size={16} /> 준비물 추가
      </Link>
    </div>
  );
}
