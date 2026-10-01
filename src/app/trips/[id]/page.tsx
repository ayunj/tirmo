import Link from "next/link";
import { ChevronRight, Menu, Palette, Plus, Share } from "lucide-react";
import { loadTrip } from "@/lib/trip";
import { dday, days, range, md, today } from "@/lib/format";
import { catColor } from "@/lib/places";
import { Flags, NamePill, coverStyle } from "@/components/bits";
import type { EventRow } from "@/lib/types";

export default async function TripHome({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, trip, members } = await loadTrip(id);

  const [ev, bk, wi] = await Promise.all([
    supabase.from("events").select("*").eq("trip_id", id),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("trip_id", id),
    supabase.from("wishes").select("id", { count: "exact", head: true }).eq("trip_id", id).eq("kind", "place"),
  ]);
  const events = (ev.data ?? []) as EventRow[];
  const ds = days(trip.start_date, trip.end_date);
  const now = today();
  const showDay = ds.includes(now) ? now : ds[0];
  const preview = events
    .filter((e) => e.day === showDay)
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 4);

  return (
    <main>
      <div className="relative h-[320px] overflow-hidden rounded-b-[26px] text-white" style={coverStyle(trip)}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
        <div className="relative flex items-center justify-between px-4 pt-4">
          <Link href="/" className="grid h-10 w-10 place-items-center rounded-full bg-black/25 backdrop-blur" aria-label="내 여행">
            <Menu size={20} />
          </Link>
          <div className="flex gap-2">
            <Link href={`/trips/${id}/edit`} className="grid h-10 w-10 place-items-center rounded-full bg-black/25 backdrop-blur" aria-label="여행 정보 수정">
              <Palette size={19} />
            </Link>
            <Link href={`/trips/${id}/invite`} className="grid h-10 w-10 place-items-center rounded-full bg-black/25 backdrop-blur" aria-label="초대">
              <Share size={19} />
            </Link>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-6 pb-7">
          <div className="text-[28px] font-extrabold leading-tight tracking-tight">{trip.title}</div>
          <div className="mt-1.5 flex items-center gap-2 text-[13px] font-semibold opacity-95">
            <Flags trip={trip} size={18} />
          </div>
        </div>
      </div>

      <div className="px-4 pt-2.5">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold">{range(trip.start_date, trip.end_date)}</span>
            {trip.start_date && <span className="rounded-[10px] bg-sky px-2.5 py-1.5 text-sm font-bold text-white">{dday(trip.start_date, trip.end_date)}</span>}
          </div>
          <div className="mt-3.5 flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {members.map((m) => (
                <NamePill key={m.user_id} name={m.profiles?.nickname || "?"} color={m.profiles?.color || "#8B95A1"} />
              ))}
            </div>
            <Link href={`/trips/${id}/invite`} className="flex flex-none items-center text-[13px] font-semibold text-sky-d">
              {members.length > 1 ? "초대하기" : "+ 같이 갈 사람 초대"}
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["일정", events.length, `/trips/${id}/plan`],
              ["예약", bk.count ?? 0, `/trips/${id}/bookings`],
              ["가고싶은곳", wi.count ?? 0, `/trips/${id}/wish`],
            ].map(([k, v, href]) => (
              <Link key={k as string} href={href as string} className="rounded-2xl bg-bg px-3.5 py-3">
                <span className="block text-[12.5px] font-semibold text-sub">{k}</span>
                <b className="text-[22px] font-bold">{v}</b>
              </Link>
            ))}
          </div>
        </section>

        <div className="mx-1 mb-2.5 mt-6 flex items-center justify-between">
          <b className="text-lg">{showDay ? `${md(showDay)} 일정` : "일정"}</b>
          <Link href={`/trips/${id}/plan`} className="flex items-center text-[13px] font-semibold text-sub">
            전체 <ChevronRight size={14} />
          </Link>
        </div>
        <section className="card px-4 py-2">
          {preview.length === 0 ? (
            <Link href={`/trips/${id}/plan/new`} className="flex items-center justify-center gap-1.5 py-5 text-sm font-semibold text-sub">
              <Plus size={16} /> 첫 일정 추가
            </Link>
          ) : (
            preview.map((e, i) => (
              <Link key={e.id} href={`/trips/${id}/plan/${e.id}`} className={`flex items-center gap-3 py-3 ${i ? "border-t border-line" : ""}`}>
                <span className="w-11 text-[13px] font-semibold text-ink2">{e.time_text || "·"}</span>
                <span className="h-2 w-2 rounded-full" style={{ background: catColor(e.category) }} />
                <b className="flex-1 truncate text-[15px] font-semibold">{e.title}</b>
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
