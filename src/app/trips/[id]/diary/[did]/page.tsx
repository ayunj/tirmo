import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock, MapPin, Pencil } from "lucide-react";
import { loadTrip } from "@/lib/trip";
import { days, md } from "@/lib/format";
import { WEATHERS } from "@/lib/diary";
import Photos from "@/components/ui/Photos";
import WeatherIcon from "@/components/Weather";
import type { Entry } from "@/lib/types";

export default async function EntryView({ params }: { params: Promise<{ id: string; did: string }> }) {
  const { id, did } = await params;
  const { supabase, trip, members } = await loadTrip(id);
  const { data } = await supabase.from("entries").select("*").eq("id", did).eq("trip_id", id).maybeSingle();
  if (!data) notFound();
  const e = data as Entry;
  const ds = days(trip.start_date, trip.end_date);
  const no = e.day ? ds.indexOf(e.day) + 1 : 0;
  const author = members.find((m) => m.user_id === e.created_by)?.profiles;

  return (
    <main className="pb-10">
      <header className="hd">
        <Link href={`/trips/${id}/diary${e.day ? `?day=${e.day}` : ""}`} className="ib -ml-2" aria-label="뒤로">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="!text-[17px]">{e.day ? `DAY ${no} · ${md(e.day)}` : "기록"}</h1>
        <Link href={`/trips/${id}/diary/${did}/edit`} className="ib" aria-label="수정">
          <Pencil size={20} />
        </Link>
      </header>
      <div className="px-4 pt-2">
        {e.photos[0] && (
          <section className="card mb-2.5 p-3">
            <Photos urls={e.photos} cols={e.photos.length === 1 ? 1 : e.photos.length === 2 ? 2 : 3} />
          </section>
        )}
        <section className="card p-5">
          {e.title && <b className="block text-[22px] font-extrabold leading-snug tracking-tight">{e.title}</b>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-sub">
            {e.time_text && (
              <span className="flex items-center gap-1">
                <Clock size={14} /> {e.time_text}
              </span>
            )}
            {e.place && (
              <span className="flex items-center gap-1 font-semibold text-ink2">
                <MapPin size={14} /> {e.place}
              </span>
            )}
            {(e.weather || e.mood) && (
              <span className="flex items-center gap-1.5">
                <WeatherIcon w={e.weather} size={16} />
                {e.weather && <span>{WEATHERS.find((w) => w.key === e.weather)?.label}</span>}
                {e.mood && <span className="text-[18px] leading-none">{e.mood}</span>}
              </span>
            )}
          </div>
          {e.body && <p className="mt-4 whitespace-pre-line text-[15.5px] leading-[1.8] text-ink2">{e.body}</p>}
          {members.length > 1 && author && (
            <span className="mt-4 inline-block rounded-md px-1.5 py-0.5 text-[11.5px] font-bold text-white" style={{ background: author.color }}>
              {author.nickname}
            </span>
          )}
        </section>
      </div>
    </main>
  );
}
