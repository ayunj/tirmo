import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip";
import { days, md } from "@/lib/format";
import { MOODS, weather } from "@/lib/diary";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import Photos from "@/components/ui/Photos";
import { DelEntry } from "@/components/EntryForm";
import type { Entry } from "@/lib/types";

export default async function EntryView({ params }: { params: Promise<{ id: string; did: string }> }) {
  const { id, did } = await params;
  const { supabase, trip, members } = await loadTrip(id);
  const { data } = await supabase.from("entries").select("*").eq("id", did).eq("trip_id", id).maybeSingle();
  if (!data) notFound();
  const e = data as Entry;
  const ds = days(trip.start_date, trip.end_date);
  const no = e.day ? ds.indexOf(e.day) + 1 : 0;
  const by = members.find((m) => m.user_id === e.created_by)?.profiles;
  const w = weather(e.weather);

  return (
    <section className="screen on" id="entryView">
      <div className="scr nonav">
        <div className="hd">
          <Go as="span" className="ib" back>
            <Ic n="chevron-left" />
          </Go>
          <h2>기록</h2>
          <Go as="span" className="ib" id="evEdit" href={`/trips/${id}/diary/${did}/edit`}>
            <Ic n="pencil" />
          </Go>
        </div>
        <div className="pad" style={{ paddingBottom: 28 }}>
          {e.photos[0] && (
            <div className="ev-p">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="im" src={e.photos[0]} alt="" />
            </div>
          )}
          <div className="ev-m">
            <div>
              <Ic n="calendar-days" />
              <span>{e.day ? `${md(e.day).replace(".", "/")}${e.time_text ? ` ${e.time_text}` : ""}` : e.time_text ?? ""}</span>
              {no > 0 && <em>DAY {no}</em>}
            </div>
            {e.place &&
              (e.event_id ? (
                <Go href={`/trips/${id}/plan/${e.event_id}`}>
                  <Ic n="map-pin" />
                  <span>{e.place}</span>
                  <Ic n="chevron-right" />
                </Go>
              ) : (
                <div>
                  <Ic n="map-pin" />
                  <span>{e.place}</span>
                </div>
              ))}
            {(w || e.mood) && (
              <div className="wxmood">
                {w && (
                  <>
                    <Ic n={w.ic} />
                    <span>{w.label}</span>
                  </>
                )}
                {w && e.mood && <i className="sep" />}
                {e.mood && (
                  <em className="ev-emo" title={MOODS.find((m) => m[0] === e.mood)?.[1]}>
                    {e.mood}
                  </em>
                )}
              </div>
            )}
          </div>
          {e.title && <h3 className="ev-h">{e.title}</h3>}
          {e.body && <p className="note ev-t">{e.body}</p>}
          {e.photos.length > 1 && (
            <div className="ev-ph">
              <Photos urls={e.photos.slice(1)} bare />
            </div>
          )}
          {by && members.length > 1 && (
            <div className="ev-by">
              <i style={{ background: by.color }}>{by.nickname.slice(0, 1)}</i>
              <span>{by.nickname}</span>
            </div>
          )}
          <DelEntry e={e} />
        </div>
      </div>
    </section>
  );
}
