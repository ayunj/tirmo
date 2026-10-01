"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto, removePhotos } from "@/lib/photo";
import { askDel, toast } from "@/lib/ui";
import { bookingTitle } from "@/lib/booking";
import { timeSort } from "@/lib/format";
import Ic from "@/components/Ic";
import type { Booking } from "@/lib/types";

/** 탑승권 · 바우처 캡처: 넣고, 크게 보고, 빼기 */
export function Captures({ b, label = "모바일 탑승권 캡처 넣기" }: { b: Booking; label?: string }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [list, setList] = useState(b.photos ?? []);
  const [busy, setBusy] = useState(false);
  const [big, setBig] = useState<number | null>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const out = [...list];
    for (const f of Array.from(files)) {
      try {
        out.push(await uploadPhoto(b.trip_id, f));
      } catch {
        toast("사진을 올리지 못했어요");
      }
    }
    await createClient().from("bookings").update({ photos: out }).eq("id", b.id);
    setList(out);
    setBusy(false);
    toast(`${out.length - list.length}장 넣었어요`);
    router.refresh();
  }
  async function del(i: number) {
    if (!(await askDel("이 캡처를 뺄까요?", undefined, "빼기"))) return;
    const out = list.filter((_, j) => j !== i);
    await createClient().from("bookings").update({ photos: out }).eq("id", b.id);
    removePhotos([list[i]]);
    setList(out);
    setBig(null);
  }

  return (
    <div className="ps-bp" id="psBp">
      {list.length === 0 ? (
        <div className="bp-add" onClick={() => ref.current?.click()}>
          <Ic n="image-plus" />
          <span>{busy ? "올리는 중…" : label}</span>
        </div>
      ) : (
        <div className="bp-list">
          {list.map((u, i) => (
            <div key={u} className="bp-i" onClick={() => setBig(i)}>
              <div className="bp-th" style={{ overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
          ))}
          <div className="bp-more" onClick={() => ref.current?.click()}>
            <Ic n={busy ? "clock-3" : "plus"} />
          </div>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      {big != null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "#000", display: "grid", placeItems: "center" }} onClick={() => setBig(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={list[big]} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          <span className="glass circ" style={{ position: "absolute", right: 16, top: 16 }}>
            <Ic n="x" />
          </span>
          <span
            className="glass circ"
            style={{ position: "absolute", left: 16, top: 16 }}
            onClick={(e) => {
              e.stopPropagation();
              del(big);
            }}
          >
            <Ic n="trash" />
          </span>
        </div>
      )}
    </div>
  );
}

/** 예약을 일정에 넣기 */
export function ToPlan({ b, days }: { b: Booking; days: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const d = b.details || {};
  const inTrip = (x?: string) => (x && days.includes(x) ? x : null);
  const ev = (day: string | undefined, time: string | undefined, title: string, category: string, address?: string) => ({
    trip_id: b.trip_id,
    booking_id: b.id,
    day: inTrip(day),
    time_text: time || null,
    sort: timeSort(time) + Math.random() / 10,
    title,
    category,
    address: address || null,
  });
  const rows =
    b.kind === "flight"
      ? [ev(d.date, d.from_time, `${d.from || "출발"} 출발`, "교통", bookingTitle(b)), ...(d.to_time ? [ev(d.date, d.to_time, `${d.to || "도착"} 도착`, "교통", b.title)] : [])]
      : b.kind === "hotel"
        ? [ev(d.checkin, d.checkin_time, "호텔 체크인", "숙소", b.title), ev(d.checkout, d.checkout_time, "체크아웃", "숙소", b.title)]
        : b.kind === "car"
          ? [ev(d.pickup_date, d.pickup_time, `렌터카 픽업 · ${b.title}`, "교통", d.pickup), ev(d.dropoff_date, d.dropoff_time, `렌터카 반납 · ${b.title}`, "교통", d.dropoff)]
          : [ev(d.date, d.time, b.title, b.kind === "restaurant" ? "음식점" : b.kind === "tour" ? "체험" : "기타", d.address)];
  return (
    <div
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        const { error } = await createClient().from("events").insert(rows);
        if (error) {
          setBusy(false);
          return toast("일정에 넣지 못했어요");
        }
        toast("일정에 넣었어요");
        router.push(`/trips/${b.trip_id}/plan?day=${rows[0].day ?? "none"}`);
        router.refresh();
      }}
    >
      <Ic n="calendar-days" /> 일정에 넣기
    </div>
  );
}

export function DelBooking({ b }: { b: Booking }) {
  const router = useRouter();
  return (
    <div
      className="dellink"
      onClick={async () => {
        if (!(await askDel("이 예약을 지울까요?", "일정에 들어간 항목은 남고 연결만 풀려요"))) return;
        const { error } = await createClient().from("bookings").delete().eq("id", b.id);
        if (error) return toast("지우지 못했어요");
        removePhotos(b.photos || []);
        toast("예약을 지웠어요");
        router.replace(`/trips/${b.trip_id}/bookings`);
        router.refresh();
      }}
    >
      <Ic n="trash" /> 예약 삭제
    </div>
  );
}

export function CopyBtn({ text }: { text: string }) {
  return (
    <div
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        toast("주소를 복사했어요");
      }}
    >
      <Ic n="copy" />
      <span>주소 복사</span>
    </div>
  );
}
