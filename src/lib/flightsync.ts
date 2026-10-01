import type { SupabaseClient } from "@supabase/supabase-js";
import { flightKo } from "@/lib/booking";
import { normTime, parseTime } from "@/lib/format";
import type { Booking } from "@/lib/types";

type Ev = { id: string; title: string; day: string | null; time_text: string | null; move_mode: string | null; move_note: string | null };

/**
 * 항공권과 연결된 출발 · 도착 일정을 예약 내용에 맞춰요.
 * 도착 일정에는 이동 방법 '비행 N시간 N분'.
 * onlyMissing 이면 비행기 표시가 빠진 것만 고쳐요 (일정 화면에서 조용히).
 */
export async function syncFlight(supabase: SupabaseClient, b: Booking, days: string[], onlyMissing = false) {
  if (b.kind !== "flight") return false;
  const d = b.details || {};
  const { data } = await supabase.from("events").select("id, title, day, time_text, move_mode, move_note").eq("booking_id", b.id);
  const evs = (data ?? []) as Ev[];
  if (!evs.length) return false;
  const dep = evs.find((e) => e.title.includes("출발"));
  const arr = evs.find((e) => e.title.includes("도착"));
  const day = d.date && days.includes(d.date) ? d.date : null;
  const dur = flightKo(d.from_time, d.to_time) || null;
  const jobs: PromiseLike<unknown>[] = [];
  if (arr && (arr.move_mode !== "flight" || (dur && arr.move_note !== dur))) {
    jobs.push(supabase.from("events").update({ move_mode: "flight", move_note: dur }).eq("id", arr.id));
  }
  if (!onlyMissing) {
    if (dep) jobs.push(supabase.from("events").update({ day, time_text: d.from_time ? normTime(d.from_time) : null, sort: parseTime(d.from_time) ?? 1500, title: `${d.from || "출발"} 출발` }).eq("id", dep.id));
    if (arr) jobs.push(supabase.from("events").update({ day, time_text: d.to_time ? normTime(d.to_time) : null, sort: parseTime(d.to_time) ?? 1500, title: `${d.to || "도착"} 도착` }).eq("id", arr.id));
    if (!arr && d.to_time) {
      jobs.push(
        supabase.from("events").insert({ trip_id: b.trip_id, booking_id: b.id, day, time_text: normTime(d.to_time), sort: parseTime(d.to_time) ?? 1500, title: `${d.to || "도착"} 도착`, category: "교통", address: b.title, move_mode: "flight", move_note: dur }),
      );
    }
  }
  await Promise.all(jobs);
  return jobs.length > 0;
}
