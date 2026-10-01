import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus } from "lucide-react";
import { loadTrip } from "@/lib/trip";
import { days, md, today } from "@/lib/format";
import LiveRefresh from "@/components/LiveRefresh";
import WeatherIcon from "@/components/Weather";
import type { Entry } from "@/lib/types";

export default async function DiaryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string }> }) {
  const { id } = await params;
  const { day } = await searchParams;
  const { supabase, trip, members } = await loadTrip(id);
  const ds = days(trip.start_date, trip.end_date);
  const now = today();
  const sel = day && ds.includes(day) ? day : ds.includes(now) ? now : ds[0];
  const i = ds.indexOf(sel);
  const { data } = await supabase.from("entries").select("*").eq("trip_id", id).order("day").order("time_text", { nullsFirst: false }).order("created_at");
  const all = (data ?? []) as Entry[];
  const list = all.filter((e) => e.day === sel || (!sel && !e.day));
  const who = (uid: string | null) => members.find((m) => m.user_id === uid)?.profiles;

  return (
    <main>
      <LiveRefresh tripId={id} table="entries" />
      <header className="hd">
        <Link href={`/trips/${id}/more`} className="ib -ml-2" aria-label="뒤로">
          <ChevronLeft size={24} />
        </Link>
        <h1>여행 기록</h1>
        <Link href={`/trips/${id}/diary/write${sel ? `?day=${sel}` : ""}`} className="ib" aria-label="기록 쓰기">
          <Plus size={22} />
        </Link>
      </header>

      {sel && (
        <div className="mt-2.5 flex items-center justify-between bg-white px-3 py-2.5">
          {i > 0 ? (
            <Link href={`?day=${ds[i - 1]}`} className="ib" aria-label="전날">
              <ChevronLeft size={20} />
            </Link>
          ) : (
            <span className="w-9" />
          )}
          <div className="text-center">
            <b className="block text-[16px]">DAY {i + 1}</b>
            <span className="text-[12.5px] text-sub">
              {md(sel)} · 기록 {list.length}
            </span>
          </div>
          {i < ds.length - 1 ? (
            <Link href={`?day=${ds[i + 1]}`} className="ib" aria-label="다음날">
              <ChevronRight size={20} />
            </Link>
          ) : (
            <span className="w-9" />
          )}
        </div>
      )}

      <div className="px-4 pt-3">
        {list.map((e, n) => {
          const author = who(e.created_by);
          const more = e.photos.length - 4;
          return (
            <Link key={e.id} href={`/trips/${id}/diary/${e.id}`} className="card mb-3 block p-3">
              {e.photos[0] && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.photos[0]} alt="" className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-2 text-[22px] font-extrabold text-white drop-shadow">{String(n + 1).padStart(2, "0")}</span>
                </div>
              )}
              <div className="px-1.5 pb-1.5 pt-3">
                {e.title && <b className="block text-[18px] font-bold tracking-tight">{e.title}</b>}
                <div className="mt-1 flex items-center gap-2.5 text-[12.5px] text-sub">
                  {e.time_text && (
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {e.time_text}
                    </span>
                  )}
                  {e.place && (
                    <span className="flex min-w-0 items-center gap-1 font-semibold text-ink2">
                      <MapPin size={13} /> <span className="truncate">{e.place}</span>
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-1.5">
                    <WeatherIcon w={e.weather} size={15} />
                    {e.mood && <span className="text-[17px] leading-none">{e.mood}</span>}
                  </span>
                </div>
                {e.body && <p className="mt-2.5 line-clamp-4 whitespace-pre-line text-[15px] leading-[1.75] text-ink2">{e.body}</p>}
                {e.photos.length > 1 && (
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {e.photos.slice(1, 5).map((p, k) => (
                      <div key={p} className="relative aspect-square overflow-hidden rounded-xl bg-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p} alt="" className="h-full w-full object-cover" loading="lazy" />
                        {k === 3 && more > 0 && <span className="absolute inset-0 grid place-items-center bg-black/45 text-[15px] font-bold text-white">+{more}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {members.length > 1 && author && (
                  <span className="mt-3 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ background: author.color }}>
                    {author.nickname}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        {list.length === 0 && <p className="py-14 text-center text-sm text-sub">{sel ? "이날 기록이 없어요" : "여행 날짜를 정하면 날마다 기록할 수 있어요"}</p>}
        <Link href={`/trips/${id}/diary/write${sel ? `?day=${sel}` : ""}`} className="addline">
          <Plus size={16} /> 기록 쓰기
        </Link>
      </div>
    </main>
  );
}
