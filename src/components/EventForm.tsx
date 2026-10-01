"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bus, Car, CarTaxiFront, ChevronRight, Footprints, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, MOVES } from "@/lib/places";
import { parseDate, timeSort, weekday } from "@/lib/format";
import type { EventRow } from "@/lib/types";

const MOVE_ICON = { walk: Footprints, transit: Bus, taxi: CarTaxiFront, car: Car } as const;

type Opt = { id: string; title: string; address?: string | null; link?: string | null };
type Props = { tripId: string; days: string[]; event?: EventRow; defaultDay?: string; bookings?: Opt[]; wishes?: Opt[]; defaultWish?: string };

export default function EventForm({ tripId, days, event, defaultDay, bookings = [], wishes = [], defaultWish }: Props) {
  const router = useRouter();
  const edit = !!event;
  // 위시리스트에서 '+ 일정'으로 들어온 경우 채워 두기
  const seed = !event && defaultWish ? wishes.find((x) => x.id === defaultWish) : undefined;
  const [title, setTitle] = useState(event?.title ?? seed?.title ?? "");
  const [cat, setCat] = useState(event?.category ?? "관광지");
  const [day, setDay] = useState<string>(event ? event.day ?? "none" : defaultDay && (days.includes(defaultDay) || defaultDay === "none") ? defaultDay : days[0] ?? "none");
  const [time, setTime] = useState(event?.time_text ?? "");
  const [move, setMove] = useState(event?.move_mode ?? "");
  const [moveNote, setMoveNote] = useState(event?.move_note ?? "");
  const [memo, setMemo] = useState(event?.memo ?? "");
  const [address, setAddress] = useState(event?.address ?? seed?.address ?? "");
  const [link, setLink] = useState(event?.link ?? seed?.link ?? "");
  const [bookingId, setBookingId] = useState(event?.booking_id ?? "");
  const [wishId, setWishId] = useState(event?.wish_id ?? seed?.id ?? "");
  const [busy, setBusy] = useState(false);

  function pickBooking(id: string) {
    setBookingId(id);
    const b = bookings.find((x) => x.id === id);
    if (b && !title.trim()) setTitle(b.title);
  }
  function pickWish(id: string) {
    setWishId(id);
    const w = wishes.find((x) => x.id === id);
    if (!w) return;
    if (!title.trim()) setTitle(w.title);
    if (!address.trim() && w.address) setAddress(w.address);
    if (!link.trim() && w.link) setLink(w.link);
  }

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
      booking_id: bookingId || null,
      wish_id: wishId || null,
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

        {(bookings.length > 0 || wishes.length > 0) && (
          <>
            <label className="flab">
              연결 <span className="font-medium text-sub">선택</span>
            </label>
            {bookings.length > 0 && (
              <select className="inp appearance-none" value={bookingId} onChange={(e) => pickBooking(e.target.value)}>
                <option value="">예약 연결 안 함</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    예약 · {b.title}
                  </option>
                ))}
              </select>
            )}
            {wishes.length > 0 && (
              <select className="inp mt-2 appearance-none" value={wishId} onChange={(e) => pickWish(e.target.value)}>
                <option value="">가고싶은곳 연결 안 함</option>
                {wishes.map((w) => (
                  <option key={w.id} value={w.id}>
                    가고싶은곳 · {w.title}
                  </option>
                ))}
              </select>
            )}
            {edit && event?.booking_id && event.booking_id === bookingId && (
              <Link href={`/trips/${tripId}/bookings/${bookingId}`} className="mt-2 flex items-center justify-between rounded-[14px] bg-sky-s px-4 py-3.5 text-[14.5px] font-bold text-sky-d">
                예약 내용 보기 <ChevronRight size={18} />
              </Link>
            )}
          </>
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
