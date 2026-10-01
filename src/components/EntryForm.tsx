"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { md, nowTime, today } from "@/lib/format";
import { MOODS, WEATHERS } from "@/lib/diary";
import { removePhotos } from "@/lib/photo";
import FormHeader from "@/components/ui/FormHeader";
import PhotoField from "@/components/ui/PhotoField";
import WeatherIcon from "@/components/Weather";
import type { Entry } from "@/lib/types";

type Ev = { id: string; day: string | null; title: string };

export default function EntryForm({ tripId, days, events, entry, defaultDay }: { tripId: string; days: string[]; events: Ev[]; entry?: Entry; defaultDay?: string }) {
  const router = useRouter();
  const edit = !!entry;
  const now = today();
  const [day, setDay] = useState(entry?.day ?? (defaultDay && days.includes(defaultDay) ? defaultDay : days.includes(now) ? now : days[0] ?? ""));
  const [time, setTime] = useState(entry?.time_text ?? (days.includes(now) ? nowTime() : ""));
  const [place, setPlace] = useState(entry?.place ?? "");
  const [eventId, setEventId] = useState(entry?.event_id ?? "");
  const [weather, setWeather] = useState(entry?.weather ?? "");
  const [mood, setMood] = useState(entry?.mood ?? "");
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [photos, setPhotos] = useState<string[]>(entry?.photos ?? []);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dayEvents = events.filter((e) => e.day === day);
  const canSave = !!(title.trim() || body.trim() || photos.length) && !uploading;

  async function save() {
    setBusy(true);
    const row = {
      trip_id: tripId,
      day: day || null,
      time_text: time.trim() || null,
      place: place.trim() || null,
      event_id: eventId || null,
      weather: weather || null,
      mood: mood || null,
      title: title.trim() || null,
      body: body.trim() || null,
      photos,
    };
    const supabase = createClient();
    const res = edit ? await supabase.from("entries").update(row).eq("id", entry!.id).select("id").single() : await supabase.from("entries").insert(row).select("id").single();
    setBusy(false);
    if (res.error) return alert("저장하지 못했어요");
    if (edit) {
      const gone = (entry!.photos || []).filter((p) => !photos.includes(p));
      if (gone.length) removePhotos(gone);
    }
    router.replace(`/trips/${tripId}/diary/${res.data.id}`);
    router.refresh();
  }

  async function remove() {
    if (!entry || !confirm("이 기록을 지울까요?")) return;
    const { error } = await createClient().from("entries").delete().eq("id", entry.id);
    if (error) return alert("지우지 못했어요");
    removePhotos(entry.photos || []);
    router.replace(`/trips/${tripId}/diary?day=${entry.day ?? ""}`);
    router.refresh();
  }

  return (
    <main className="pb-10">
      <FormHeader title={edit ? "기록 수정" : "기록 쓰기"} onSave={save} canSave={canSave} busy={busy} />
      <div className="px-4 pt-2">
        <section className="card px-4">
          <div className="flex items-center gap-3 border-b border-line py-3">
            <CalendarDays size={18} className="flex-none text-sub" />
            <select className="min-w-0 flex-1 appearance-none bg-transparent text-[15px] font-semibold outline-none" value={day} onChange={(e) => setDay(e.target.value)}>
              {days.map((d, i) => (
                <option key={d} value={d}>
                  DAY {i + 1} · {md(d)}
                </option>
              ))}
            </select>
            <input className="w-[72px] bg-transparent text-right text-[15px] font-semibold outline-none placeholder:text-sub2" value={time} onChange={(e) => setTime(e.target.value)} placeholder="시간" inputMode="numeric" />
          </div>
          <div className="flex items-center gap-3 border-b border-line py-3">
            <MapPin size={18} className="flex-none text-sub" />
            <input
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-sub2"
              value={place}
              onChange={(e) => {
                setPlace(e.target.value);
                setEventId("");
              }}
              placeholder="장소"
            />
          </div>
          <div className="flex items-center justify-between py-2.5">
            {WEATHERS.map((w) => (
              <button
                key={w.key}
                onClick={() => setWeather(weather === w.key ? "" : w.key)}
                aria-label={w.label}
                className={`grid h-10 w-12 place-items-center rounded-xl ${weather === w.key ? "bg-char text-white" : "text-sub"}`}
              >
                <WeatherIcon w={w.key} size={20} />
              </button>
            ))}
          </div>
        </section>

        {dayEvents.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12.5px] font-semibold text-sub">이날 일정</span>
            {dayEvents.map((e) => (
              <button
                key={e.id}
                className={`chip !py-1.5 !text-[13px] ${eventId === e.id ? "on" : ""}`}
                onClick={() => {
                  if (eventId === e.id) {
                    setEventId("");
                  } else {
                    setEventId(e.id);
                    setPlace(e.title);
                  }
                }}
              >
                {e.title}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex justify-between gap-1 rounded-2xl bg-white px-2 py-2">
          {MOODS.map((m) => (
            <button key={m} onClick={() => setMood(mood === m ? "" : m)} className={`grid h-10 flex-1 place-items-center rounded-xl text-[24px] transition ${mood === m ? "bg-sky-s" : mood ? "opacity-40" : ""}`}>
              {m}
            </button>
          ))}
        </div>

        <section className="card mt-3 p-4">
          <input className="w-full bg-transparent text-[19px] font-bold outline-none placeholder:text-sub2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />
          <textarea className="mt-2 min-h-[180px] w-full resize-none bg-transparent text-[15.5px] leading-[1.75] outline-none placeholder:text-sub2" value={body} onChange={(e) => setBody(e.target.value)} placeholder="오늘 어땠어요?" />
        </section>

        <label className="flab mx-1">
          사진 <span className="text-sky-d">{photos.length || ""}</span>
        </label>
        <PhotoField tripId={tripId} value={photos} onChange={setPhotos} onBusy={setUploading} max={20} />

        {edit && (
          <button className="dellink w-full" onClick={remove}>
            <Trash2 size={16} /> 기록 삭제
          </button>
        )}
      </div>
    </main>
  );
}
