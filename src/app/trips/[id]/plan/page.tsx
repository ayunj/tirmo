import Link from "next/link";
import { Bus, Car, CarTaxiFront, ChevronDown, Footprints, Plus } from "lucide-react";
import { loadTrip } from "@/lib/trip";
import { days, iso, md, parseDate, range, weekday } from "@/lib/format";
import { catColor, MOVES } from "@/lib/places";
import LiveRefresh from "@/components/LiveRefresh";
import type { EventRow } from "@/lib/types";

const MOVE_ICON = { walk: Footprints, transit: Bus, taxi: CarTaxiFront, car: Car } as const;

export default async function PlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string }> }) {
  const { id } = await params;
  const { day } = await searchParams;
  const { supabase, trip } = await loadTrip(id);
  const ds = days(trip.start_date, trip.end_date);
  const today = iso(new Date());
  const sel = day ?? (ds.includes(today) ? today : ds[0] ?? "none");

  const { data } = await supabase.from("events").select("*").eq("trip_id", id).order("sort");
  const all = (data ?? []) as EventRow[];
  const list = all.filter((e) => (sel === "none" ? !e.day : e.day === sel));
  const undated = all.filter((e) => !e.day).length;
  const dayNo = ds.indexOf(sel) + 1;

  return (
    <main>
      <LiveRefresh tripId={id} table="events" />
      <header className="hd !pb-1">
        <Link href="/" className="flex-1">
          <div className="flex items-center gap-1 text-[21px] font-bold tracking-tight">
            {trip.title} <ChevronDown size={18} />
          </div>
          <div className="s13">{range(trip.start_date, trip.end_date)}</div>
        </Link>
        <Link href={`/trips/${id}/plan/new?day=${sel}`} className="ib" aria-label="일정 추가">
          <Plus size={22} />
        </Link>
      </header>
      <nav className="tabs sticky top-[68px] z-10 overflow-x-auto">
        {ds.map((d) => (
          <Link key={d} href={`?day=${d}`} className={`flex-none ${d === sel ? "on" : ""}`}>
            {parseDate(d).getDate()}일 {weekday(d)}
          </Link>
        ))}
        <Link href="?day=none" className={`flex-none ${sel === "none" ? "on" : ""}`}>
          날짜 미정{undated ? ` ${undated}` : ""}
        </Link>
      </nav>

      <div className="px-4">
        <div className="mx-1 mb-2 mt-5 flex items-center justify-between">
          <b className="text-base">{sel === "none" ? "날짜 미정" : `DAY ${dayNo} · ${md(sel)}`}</b>
          <span className="s13">{list.length}개 일정</span>
        </div>

        <section className="card px-4 py-2">
          {list.length === 0 && <p className="py-8 text-center text-sm text-sub">아직 일정이 없어요</p>}
          {list.map((e, i) => {
            const M = e.move_mode ? MOVE_ICON[e.move_mode as keyof typeof MOVE_ICON] : null;
            const moveLabel = MOVES.find((m) => m.key === e.move_mode)?.label;
            return (
              <div key={e.id}>
                {i > 0 && (
                  <div className="relative ml-[54px] py-0.5 pl-[22px]">
                    <span className="absolute bottom-0 left-[7px] top-0 w-0.5 bg-line" />
                    {M ? (
                      <Link href={`/trips/${id}/plan/${e.id}`} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-sky-d">
                        <M size={14} /> {moveLabel}
                        {e.move_note ? ` · ${e.move_note}` : ""}
                      </Link>
                    ) : (
                      <Link href={`/trips/${id}/plan/${e.id}#move`} className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-dashed border-[#c6cad1] px-2.5 py-0.5 text-xs text-sub">
                        <Plus size={12} /> 이동 방법
                      </Link>
                    )}
                  </div>
                )}
                <Link href={`/trips/${id}/plan/${e.id}`} className="relative flex gap-2.5 py-2.5">
                  <span className={`w-11 flex-none pt-0.5 text-sm font-semibold ${e.time_text && /\d/.test(e.time_text) ? "text-ink2" : "text-sub"}`}>{e.time_text || "·"}</span>
                  <span className="relative w-4 flex-none">
                    <span className={`absolute left-[7px] w-0.5 bg-line ${i === 0 ? "top-3" : "top-0"} ${i === list.length - 1 ? "h-3" : "bottom-[-10px]"}`} />
                    <span className="absolute left-[2px] top-[5px] h-3 w-3 rounded-full border-[3px] border-white" style={{ background: catColor(e.category) }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-base font-semibold">{e.title}</b>
                    {e.address && <span className="s13 block">{e.address}</span>}
                    {e.memo && <span className="mt-2 block whitespace-pre-line rounded-[10px] bg-bg px-3 py-2 text-[13px] leading-relaxed text-ink2">{e.memo}</span>}
                  </span>
                </Link>
              </div>
            );
          })}
        </section>

        <Link href={`/trips/${id}/plan/new?day=${sel}`} className="addline mt-3">
          <Plus size={16} /> 일정 추가
        </Link>
      </div>
    </main>
  );
}
