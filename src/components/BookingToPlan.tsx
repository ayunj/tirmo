"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { bookingTitle } from "@/lib/booking";
import { timeSort } from "@/lib/format";
import type { Booking } from "@/lib/types";

/** 예약을 일정에 넣기 (숙소는 체크인 · 체크아웃 두 개) */
export default function BookingToPlan({ b, days }: { b: Booking; days: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const d = b.details;
  const inTrip = (x?: string) => (x && days.includes(x) ? x : null);

  function rows() {
    const base = { trip_id: b.trip_id, booking_id: b.id };
    const ev = (day: string | undefined, time: string | undefined, title: string, category: string, extra: object = {}) => ({
      ...base,
      day: inTrip(day),
      time_text: time || null,
      sort: timeSort(time) + Math.random() / 10,
      title,
      category,
      ...extra,
    });
    switch (b.kind) {
      case "flight":
        return [ev(d.date, d.from_time, `${[d.airline, d.flight_no].filter(Boolean).join(" ")} ${bookingTitle(b)}`.trim(), "교통")];
      case "hotel":
        return [
          ev(d.checkin, d.checkin_time, `체크인 · ${b.title}`, "숙소", { address: d.address || null }),
          ev(d.checkout, d.checkout_time, `체크아웃 · ${b.title}`, "숙소", { address: d.address || null }),
        ];
      case "car":
        return [ev(d.pickup_date, d.pickup_time, `렌터카 · ${d.pickup || b.title}`, "교통", { address: d.pickup || null })];
      case "restaurant":
        return [ev(d.date, d.time, b.title, "음식점", { address: d.address || null })];
      case "tour":
        return [ev(d.date, d.time, b.title, "체험", { address: d.address || null })];
      default:
        return [ev(d.date, d.time, b.title, "기타", { address: d.address || null })];
    }
  }

  return (
    <button
      className="btn flex items-center justify-center gap-1.5 !py-3.5 !text-[15px]"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = rows();
        const { error } = await createClient().from("events").insert(r);
        if (error) {
          setBusy(false);
          return alert("일정에 넣지 못했어요");
        }
        router.push(`/trips/${b.trip_id}/plan?day=${r[0].day ?? "none"}`);
        router.refresh();
      }}
    >
      <CalendarPlus size={17} /> 일정에 넣기
    </button>
  );
}
