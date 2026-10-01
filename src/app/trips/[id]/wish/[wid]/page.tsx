import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, CalendarPlus, ChevronLeft, ExternalLink, MapPin, Pencil } from "lucide-react";
import { loadTrip } from "@/lib/trip";
import { days, md } from "@/lib/format";
import { catColor } from "@/lib/places";
import Photos from "@/components/ui/Photos";
import type { Wish } from "@/lib/types";

export default async function WishView({ params }: { params: Promise<{ id: string; wid: string }> }) {
  const { id, wid } = await params;
  const { supabase, trip } = await loadTrip(id);
  const [{ data }, ev] = await Promise.all([
    supabase.from("wishes").select("*").eq("id", wid).eq("trip_id", id).maybeSingle(),
    supabase.from("events").select("id, day, time_text").eq("wish_id", wid).order("day"),
  ]);
  if (!data) notFound();
  const w = data as Wish;
  if (w.kind === "shop") redirect(`/trips/${id}/wish/${wid}/edit`);
  const ds = days(trip.start_date, trip.end_date);
  const linked = ev.data ?? [];

  return (
    <main className="pb-10">
      <header className="hd">
        <Link href={`/trips/${id}/wish`} className="ib -ml-2" aria-label="뒤로">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="truncate">{w.name}</h1>
        <Link href={`/trips/${id}/wish/${wid}/edit`} className="ib" aria-label="수정">
          <Pencil size={20} />
        </Link>
      </header>
      <div className="px-4 pt-2">
        {w.photos?.length > 0 && (
          <section className="card mb-2.5 p-3">
            <Photos urls={w.photos} cols={w.photos.length === 1 ? 1 : w.photos.length === 2 ? 2 : 3} />
          </section>
        )}
        <section className="card p-5">
          {w.category && (
            <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12px] font-bold" style={{ background: `${catColor(w.category)}1a`, color: catColor(w.category) }}>
              {w.category}
            </span>
          )}
          <b className="mt-2 block text-[22px] font-extrabold tracking-tight">{w.name}</b>
          {w.address && (
            <p className="mt-2 flex items-center gap-1.5 text-[14px] text-ink2">
              <MapPin size={15} className="text-sub" /> {w.address}
            </p>
          )}
          {w.memo && <p className="mt-3 whitespace-pre-line rounded-xl bg-bg px-3.5 py-3 text-[14px] leading-relaxed text-ink2">{w.memo}</p>}
          {w.link && /^https?:\/\//.test(w.link) && (
            <a href={w.link} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1.5 text-[14px] font-semibold text-sky-d">
              <ExternalLink size={15} /> 링크 열기
            </a>
          )}
        </section>

        {linked.length > 0 ? (
          <Link href={`/trips/${id}/plan?day=${linked[0].day ?? "none"}`} className="btn mt-4 flex items-center justify-center gap-1.5">
            <CalendarDays size={18} /> 일정에서 보기 ·{" "}
            {linked[0].day ? `DAY ${ds.indexOf(linked[0].day) + 1} ${md(linked[0].day)}` : "날짜 미정"}
          </Link>
        ) : (
          <Link href={`/trips/${id}/plan/new?wish=${wid}`} className="btn mt-4 flex items-center justify-center gap-1.5">
            <CalendarPlus size={18} /> 일정에 넣기
          </Link>
        )}
      </div>
    </main>
  );
}
