"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { md, nowTime, today } from "@/lib/format";
import { MOODS, WEATHERS } from "@/lib/diary";
import { EXP_CATS, sym } from "@/lib/money";
import { uploadPhoto, removePhotos } from "@/lib/photo";
import { askDel, toast } from "@/lib/ui";
import Go from "@/components/Go";
import SaveBar from "@/components/ui/SaveBar";
import Ic from "@/components/Ic";
import DatePick from "@/components/ui/DatePick";
import type { Entry, Pocket } from "@/lib/types";

type Ev = { id: string; day: string | null; title: string };
type Props = { tripId: string; days: string[]; events: Ev[]; entry?: Entry; defaultDay?: string; defaultEvent?: string; me: string; currency: string; pockets: Pocket[] };

/** 기록 쓰기 · 고치기 (목업 write) */
export default function EntryForm({ tripId, days, events, entry, defaultDay, defaultEvent, me, currency, pockets }: Props) {
  const router = useRouter();
  const edit = !!entry;
  const now = today();
  const ev0 = defaultEvent ? events.find((e) => e.id === defaultEvent) : undefined;
  const [day, setDay] = useState(entry?.day ?? ev0?.day ?? (defaultDay && days.includes(defaultDay) ? defaultDay : days.includes(now) ? now : days[0] ?? ""));
  const [time, setTime] = useState(entry?.time_text ?? (days.includes(now) ? nowTime() : ""));
  const [place, setPlace] = useState(entry?.place ?? ev0?.title ?? "");
  const [eventId, setEventId] = useState(entry?.event_id ?? ev0?.id ?? "");
  const [wx, setWx] = useState(entry?.weather ?? "");
  const [mood, setMood] = useState(entry?.mood ?? "");
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [photos, setPhotos] = useState<string[]>(entry?.photos ?? []);
  const [loading, setLoading] = useState(0);
  const [inPdf, setInPdf] = useState(entry?.in_pdf ?? true);
  const [withExp, setWithExp] = useState(false);
  const [amt, setAmt] = useState("");
  const [pk, setPk] = useState(pockets.find((p) => p.shared)?.id ?? pockets[0]?.id ?? "");
  const [cat, setCat] = useState("식비");
  const [dp, setDp] = useState(false);
  const [busy, setBusy] = useState(false);
  const snap = JSON.stringify([day, time, place, eventId, wx, mood, title, body, photos, inPdf, withExp, amt, pk, cat]);
  const [snap0] = useState(snap);
  const changed = snap !== snap0;
  const fileRef = useRef<HTMLInputElement>(null);
  const dayEvents = events.filter((e) => e.day === day);
  const no = days.indexOf(day) + 1;

  async function addFiles(fs: FileList | null) {
    if (!fs?.length) return;
    const list = Array.from(fs).slice(0, 30 - photos.length);
    setLoading(list.length);
    const out = [...photos];
    for (const f of list) {
      try {
        out.push(await uploadPhoto(tripId, f));
        setPhotos([...out]);
      } catch {
        toast("사진을 올리지 못했어요");
      }
      setLoading((n) => n - 1);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function save() {
    if (!title.trim() && !body.trim() && !photos.length) return toast("제목이나 내용을 적어 주세요");
    if (loading) return toast("사진을 올리는 중이에요");
    setBusy(true);
    const row = { trip_id: tripId, day: day || null, time_text: time.trim() || null, place: place.trim() || null, event_id: eventId || null, weather: wx || null, mood: mood || null, title: title.trim() || null, body: body.trim() || null, photos, in_pdf: inPdf };
    const supabase = createClient();
    const res = edit ? await supabase.from("entries").update(row).eq("id", entry!.id).select("id").single() : await supabase.from("entries").insert(row).select("id").single();
    if (res.error) {
      setBusy(false);
      return toast("저장하지 못했어요");
    }
    if (edit) {
      const gone = (entry!.photos || []).filter((p) => !photos.includes(p));
      if (gone.length) removePhotos(gone);
    }
    const a = Number(amt.replace(/[^\d.]/g, ""));
    if (!edit && withExp && a > 0) {
      const p = pockets.find((x) => x.id === pk);
      await supabase.from("expenses").insert({ trip_id: tripId, pocket_id: p?.id ?? null, payer_id: p?.shared ? null : p?.owner_id ?? me, amount: a, currency: p?.currency ?? currency, category: cat, title: title.trim() || place.trim() || "기록에서 쓴 돈", day: day || null, time_text: time.trim() || null });
    }
    router.replace(`/trips/${tripId}/diary/${res.data.id}`);
    router.refresh();
  }

  const cur = pockets.find((p) => p.id === pk)?.currency ?? currency;
  return (
    <section className="screen on hasbar" id="write">
      <div className="scr nonav">
        <div className="hd">
          <Go as="span" className="ib" back>
            <Ic n="x" />
          </Go>
          <h2>{edit ? "기록 수정" : "기록 쓰기"}</h2>
        </div>
        <div className="pad" style={{ paddingBottom: 28 }}>
          <div className="wmeta">
            <div onClick={() => days.length && setDp(true)} style={{ cursor: "pointer" }}>
              <Ic n="calendar-days" />
              <span>{day ? `${md(day).replace(".", "/")}${time ? ` ${time}` : ""}` : time || "날짜"}</span>
              {no > 0 && <i>DAY {no}</i>}
            </div>
            <div className="wplace">
              <Ic n="map-pin" />
              <input
                className="wp-t"
                value={place}
                onChange={(e) => {
                  setPlace(e.target.value);
                  setEventId("");
                }}
                placeholder="장소"
                style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", fontFamily: "inherit", fontSize: 14 }}
              />
            </div>
            <div className="wx">
              <Ic n={WEATHERS.find((w) => w.key === wx)?.ic ?? "cloud-sun"} />
              <span className="wx-i">
                {WEATHERS.map((w) => (
                  <span key={w.key} className={wx === w.key ? "on" : ""} title={w.label} onClick={() => setWx(wx === w.key ? "" : w.key)}>
                    <Ic n={w.ic} />
                  </span>
                ))}
              </span>
            </div>
          </div>
          {dayEvents.length > 0 && (
            <div className="wsug">
              <span className="sub">DAY {no} 일정</span>
              {dayEvents.map((e) => (
                <span
                  key={e.id}
                  data-wp=""
                  className={eventId === e.id ? "on" : ""}
                  onClick={() => {
                    if (eventId === e.id) return setEventId("");
                    setEventId(e.id);
                    setPlace(e.title);
                  }}
                >
                  {e.title}
                </span>
              ))}
            </div>
          )}
          <div className="moods">
            {MOODS.map(([m, l]) => (
              <span key={m} className={mood === m ? "on" : ""} title={l} onClick={() => setMood(mood === m ? "" : m)}>
                <em>{m}</em>
              </span>
            ))}
          </div>
          <input className="wtitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" style={{ display: "block", width: "100%", border: 0, outline: 0, fontFamily: "inherit" }} />
          <textarea className="wtext note" value={body} onChange={(e) => setBody(e.target.value)} placeholder="오늘 어땠어요?" style={{ display: "block", width: "100%", border: 0, outline: 0, fontFamily: "inherit", resize: "none" }} />
          <div className="flab row" style={{ marginTop: 18 }}>
            <span>
              사진 <b className="wcnt">{photos.length}</b>
            </span>
          </div>
          <div className="wphotos">
            {photos.map((u, i) => (
              <div key={u} className={i === 0 ? "cv" : ""} onClick={() => i > 0 && setPhotos([u, ...photos.filter((x) => x !== u)])}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="im" src={u} alt="" />
                <b
                  className="wx-x"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotos(photos.filter((x) => x !== u));
                  }}
                >
                  <Ic n="x" />
                </b>
                <em>대표</em>
              </div>
            ))}
            {Array.from({ length: loading }).map((_, i) => (
              <div key={`l${i}`} className="add" style={{ borderStyle: "solid" }}>
                <Ic n="clock-3" />
                <span>올리는 중</span>
              </div>
            ))}
            <div className="add" onClick={() => fileRef.current?.click()}>
              <Ic n="camera" />
              <span>추가</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          {!edit && (
            <>
              <div className="switches">
                <div onClick={() => setWithExp(!withExp)}>
                  <Ic n="receipt" />
                  <span>지출도 같이 기록</span>
                  <i className={`sw${withExp ? " on" : ""}`} />
                </div>
              </div>
              <div className={`wexp${withExp ? " on" : ""}`}>
                <div className="wexp-a">
                  <span className="cur">{sym(cur).trim()}</span>
                  <input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0" style={{ border: 0, outline: 0, background: "none", fontFamily: "inherit", fontSize: 24, fontWeight: 800, width: "60%" }} />
                </div>
                {pockets.length > 0 && (
                  <div className="chips flush wpk">
                    {pockets.map((p) => (
                      <span key={p.id} className={`chip${pk === p.id ? " on" : ""}`} onClick={() => setPk(p.id)}>
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="chips flush wcat">
                  {EXP_CATS.map((c) => (
                    <span key={c.key} className={`chip${cat === c.key ? " on" : ""}`} onClick={() => setCat(c.key)}>
                      {c.key}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="switches">
            <div onClick={() => setInPdf(!inPdf)}>
              <Ic n="book-open" />
              <span>PDF 여행책에 넣기</span>
              <i className={`sw${inPdf ? " on" : ""}`} />
            </div>
          </div>
          {edit && <DelEntry e={entry!} />}
        </div>
      </div>
      <DatePick
        open={dp}
        onClose={() => setDp(false)}
        mode="single"
        a={day || days[0]}
        time={time}
        withTime
        onDone={(a, _b, t) => {
          if (a) setDay(a);
          setTime(t);
          setEventId("");
        }}
      />
      <SaveBar on={(!entry || changed) && !!(title.trim() || body.trim() || photos.length) && !loading} busy={busy} onSave={save} />
    </section>
  );
}

export function DelEntry({ e }: { e: Entry }) {
  const router = useRouter();
  return (
    <div
      className="dellink"
      id="evDel"
      onClick={async () => {
        if (!(await askDel("이 기록을 지울까요?", "사진도 같이 지워지고 되돌릴 수 없어요"))) return;
        const { error } = await createClient().from("entries").delete().eq("id", e.id);
        if (error) return toast("지우지 못했어요");
        removePhotos(e.photos || []);
        toast("기록을 지웠어요");
        router.replace(`/trips/${e.trip_id}/diary${e.day ? `?day=${e.day}` : ""}`);
        router.refresh();
      }}
    >
      <Ic n="trash" /> 기록 삭제
    </div>
  );
}
