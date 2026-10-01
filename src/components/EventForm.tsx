"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, Car, CarTaxiFront, Footprints, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, MOVES } from "@/lib/places";
import { parseDate, timeSort, weekday } from "@/lib/format";
import type { EventRow } from "@/lib/types";

const MOVE_ICON = { walk: Footprints, transit: Bus, taxi: CarTaxiFront, car: Car } as const;

type Props = { tripId: string; days: string[]; event?: EventRow; defaultDay?: string };

export default function EventForm({ tripId, days, event, defaultDay }: Props) {
  const router = useRouter();
  const edit = !!event;
  const [title, setTitle] = useState(event?.title ?? "");
  const [cat, setCat] = useState(event?.category ?? "관광지");
  const [day, setDay] = useState<string>(event ? event.day ?? "none" : defaultDay && (days.includes(defaultDay) || defaultDay === "none") ? defaultDay : days[0] ?? "none");
  const [time, setTime] = useState(event?.time_text ?? "");
  const [move, setMove] = useState(event?.move_mode ?? "");
  const [moveNote, setMoveNote] = useState(event?.move_note ?? "");
  const [memo, setMemo] = useState(event?.memo ?? "");
  const [address, setAddress] = useState(event?.address ?? "");
  const [link, setLink] = useState(event?.link ?? "");
  const [busy, setBusy] = useState(false);

  const back = `/trips/${tripId}/plan?day=${day}`;

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    const supabase = createClient();
    const row = {
      trip_id: tripId,
      title: title.trim(),
      category: cat,
      day: day === "none" ? null : day,
      time_text: time.trim() || null,
      sort: timeSort(time) + Math.random() / 10,
      move_mode: move || null,
      move_note: moveNote.trim() || null,
      memo: memo.trim() || null,
      address: address.trim() || null,
      link: link.trim() || null,
    };
    const { error } = edit ? await supabase.from("events").update(row).eq("id", event!.id) : await supabase.from("events").insert(row);
    setBusy(false);
    if (error) return alert("저장하지 못했어요");
    router.replace(back);
    router.refresh();
  }

  async function remove() {
    if (!event || !confirm("일정에서 뺄까요?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) return alert("지우지 못했어요");
    router.replace(back);
    router.refresh();
  }

  return (
    <main className="pb-10">
      <header className="hd">
        <button className="ib" onClick={() => router.back()} aria-label="닫기">
          <X size={22} />
        </button>
        <h1>{edit ? "일정" : "일정 추가"}</h1>
        <button className="px-1 text-[15px] font-bold text-sky-d disabled:text-sub2" disabled={!title.trim() || busy} onClick={save}>
          저장
        </button>
      </header>

      <div className="px-5">
        <label className="flab">이름</label>
        <input className="inp !text-[17px] font-semibold" autoFocus={!edit} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="어디 가요? 뭐 해요?" />

        <label className="flab">분류</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c.key} className={`chip ${cat === c.key ? "on" : ""}`} onClick={() => setCat(c.key)}>
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: c.color }} />
              {c.key}
            </button>
          ))}
        </div>

        <label className="flab">날짜</label>
        <div className="flex flex-wrap gap-1.5">
          {days.map((d, i) => (
            <button key={d} className={`chip ${day === d ? "on" : ""}`} onClick={() => setDay(d)}>
              DAY {i + 1} · {parseDate(d).getMonth() + 1}/{parseDate(d).getDate()} {weekday(d)}
            </button>
          ))}
          <button className={`chip ${day === "none" ? "on" : ""}`} onClick={() => setDay("none")}>
            날짜 미정
          </button>
        </div>

        <label className="flab">
          시간 <span className="font-medium text-sub">선택</span>
        </label>
        <input className="inp" value={time} onChange={(e) => setTime(e.target.value)} placeholder="예) 14:30, 오후, 저녁" />

        <label className="flab" id="move">
          가는 방법 <span className="font-medium text-sub">선택</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {MOVES.map((m) => {
            const I = MOVE_ICON[m.key as keyof typeof MOVE_ICON];
            const on = move === m.key;
            return (
              <button key={m.key} onClick={() => setMove(on ? "" : m.key)} className={`flex flex-col items-center gap-1 rounded-2xl border-[1.5px] bg-white py-3 text-[13px] font-bold ${on ? "border-char text-ink" : "border-line text-ink2"}`}>
                <I size={20} />
                {m.label}
              </button>
            );
          })}
        </div>
        {move && <input className="inp mt-2" value={moveNote} onChange={(e) => setMoveNote(e.target.value)} placeholder="예) 공항버스 30분 · ¥500" />}

        <label className="flab">
          메모 <span className="font-medium text-sub">선택</span>
        </label>
        <textarea className="inp min-h-[96px] resize-none leading-relaxed" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="가격, 대안, 참고할 점" />

        <label className="flab">
          주소 · 링크 <span className="font-medium text-sub">선택</span>
        </label>
        <input className="inp" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="적어두고 싶으면" />
        <input className="inp mt-2" value={link} onChange={(e) => setLink(e.target.value)} placeholder="링크 붙여넣기 (예약 페이지, 블로그)" inputMode="url" />
        {link && /^https?:\/\//.test(link) && (
          <a href={link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] font-semibold text-sky-d">
            링크 열기
          </a>
        )}

        {edit && (
          <button className="dellink w-full" onClick={remove}>
            <Trash2 size={16} /> 일정에서 빼기
          </button>
        )}
      </div>
    </main>
  );
}
