import { loadTrip } from "@/lib/trip";
import { days, parseDate, today, weekday } from "@/lib/format";
import Go from "@/components/Go";
import TripTitle from "@/components/TripTitle";
import Ic from "@/components/Ic";
import LiveRefresh from "@/components/LiveRefresh";
import WeatherIcon from "@/components/Weather";
import type { Entry } from "@/lib/types";

export default async function DiaryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string }> }) {
  const { id } = await params;
  const { day } = await searchParams;
  const { supabase, trip } = await loadTrip(id);
  const ds = days(trip.start_date, trip.end_date);
  const now = today();
  const sel = day && ds.includes(day) ? day : ds.includes(now) ? now : ds[0];
  const i = ds.indexOf(sel);
  const { data } = await supabase.from("entries").select("*").eq("trip_id", id).order("day").order("time_text", { nullsFirst: false }).order("created_at");
  const list = ((data ?? []) as Entry[]).filter((e) => e.day === sel || (!sel && !e.day));
  const d = sel ? parseDate(sel) : null;
  const base = `/trips/${id}/diary`;

  return (
    <section className="screen on" id="diary">
      <LiveRefresh tripId={id} table="entries" />
      <div className="scr">
        <div className="hd">
          <TripTitle id={id} title={trip.title} start={trip.start_date} end={trip.end_date} label="여행 기록" />
          <Go as="span" className="ib" href={`${base}/write${sel ? `?day=${sel}` : ""}`}>
            <Ic n="plus" />
          </Go>
        </div>
        {sel && d && (
          <div className="daynav">
            {i > 0 ? (
              <Go as="span" className="ib sm" href={`${base}?day=${ds[i - 1]}`} replace>
                <Ic n="chevron-left" />
              </Go>
            ) : (
              <span className="ib sm" style={{ opacity: 0.25 }}>
                <Ic n="chevron-left" />
              </span>
            )}
            <div>
              <b>DAY {i + 1}</b>
              <span className="sub">
                {d.getMonth() + 1}.{d.getDate()} {weekday(sel)} · 기록 {list.length}
              </span>
            </div>
            {i < ds.length - 1 ? (
              <Go as="span" className="ib sm" href={`${base}?day=${ds[i + 1]}`} replace>
                <Ic n="chevron-right" />
              </Go>
            ) : (
              <span className="ib sm" style={{ opacity: 0.25 }}>
                <Ic n="chevron-right" />
              </span>
            )}
          </div>
        )}
        <div className="pad" style={{ paddingBottom: 24 }}>
          {list.map((e, n) => (
            <Go key={e.id} className="entry" href={`${base}/${e.id}`}>
              {e.photos[0] && (
                <div className="en-p">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="im" src={e.photos[0]} alt="" />
                  <span className="disp en-n">{String(n + 1).padStart(2, "0")}</span>
                </div>
              )}
              {e.title && <h4 className="en-h">{e.title}</h4>}
              <div className="en-m">
                {e.time_text && (
                  <span>
                    <Ic n="clock-3" /> {e.time_text}
                  </span>
                )}
                {e.place && (
                  <span>
                    <Ic n="map-pin" /> <b>{e.place}</b>
                  </span>
                )}
                {e.mood && <span className="en-mood">{e.mood}</span>}
                <span style={{ marginLeft: "auto" }}>
                  <WeatherIcon w={e.weather} />
                </span>
              </div>
              {e.body && <p className="note en-t">{e.body.length > 140 ? `${e.body.slice(0, 140)}…` : e.body}</p>}
              {e.photos.length > 1 && (
                <div className="strip">
                  {e.photos.slice(1, 5).map((p, k) => (
                    <div key={p}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="im" src={p} alt="" loading="lazy" />
                      {k === 3 && e.photos.length > 5 && <span className="more">+{e.photos.length - 5}</span>}
                    </div>
                  ))}
                </div>
              )}
            </Go>
          ))}
          {list.length === 0 && <div className="sub" style={{ textAlign: "center", padding: "50px 0 10px" }}>{sel ? "이날 기록이 아직 없어요" : "여행 날짜를 정하면 날마다 기록할 수 있어요"}</div>}
          <Go className="addline" href={`${base}/write${sel ? `?day=${sel}` : ""}`} style={{ marginTop: 14 }}>
            <Ic n="plus" /> 오늘의 기록 추가
          </Go>
        </div>
      </div>
    </section>
  );
}
