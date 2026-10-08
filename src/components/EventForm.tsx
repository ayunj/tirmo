"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EV_CATS, evCat } from "@/lib/cats";
import { autoAt, byEv, normTime, parseDate, parseTime, sortAt } from "@/lib/format";
import TimeInput from "@/components/ui/TimeInput";
import { uploadPhoto } from "@/lib/photo";
import { toast } from "@/lib/ui";
import Go from "@/components/Go";
import SaveBar from "@/components/ui/SaveBar";
import { normDur } from "@/lib/move";
import Ic, { type IcName } from "@/components/Ic";
import Sheet from "@/components/ui/Sheet";
import type { EventRow } from "@/lib/types";

export type LinkOpt = { id: string; wk?: "place" | "shop"; title: string; sub?: string; ic?: IcName; c?: string; address?: string | null; link?: string | null; cat?: string };
type DayEv = Pick<EventRow, "id" | "day" | "time_text" | "sort" | "title">;

type Props = {
  tripId: string;
  days: string[];
  dayEvents: DayEv[];
  defaultDay?: string;
  bookings: LinkOpt[];
  wishes: LinkOpt[];
  frequent: LinkOpt[];
  defaultWish?: string;
};

const MOVES: [string, IcName, string][] = [
  ["flight", "plane", "비행기"],
  ["walk", "footprints", "도보"],
  ["transit", "train-front", "대중교통"],
  ["taxi", "car-taxi-front", "택시"],
  ["car", "car", "차"],
];

/** 새 일정 (목업 eventAdd) */
export default function EventForm({ tripId, days, dayEvents, defaultDay, bookings, wishes, frequent, defaultWish }: Props) {
  const router = useRouter();
  const seed = defaultWish ? wishes.find((w) => w.id === defaultWish) : undefined;
  const [title, setTitle] = useState(seed?.title ?? "");
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState({ f: false, w: false });
  const [cat, setCat] = useState(seed?.cat ?? "관광지");
  const [catAll, setCatAll] = useState(false);
  const [day, setDay] = useState<string>(defaultDay && (days.includes(defaultDay) || defaultDay === "none") ? defaultDay : days[0] ?? "none");
  const [time, setTime] = useState("");
  const [slot, setSlot] = useState<number | null>(null);
  const [move, setMove] = useState("");
  const [moveDur, setMoveDur] = useState("");
  const [moveMemo, setMoveMemo] = useState("");
  const [address, setAddress] = useState(seed?.address ?? "");
  const [memo, setMemo] = useState("");
  const [link, setLink] = useState(seed?.link ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [bookingIds, setBookingIds] = useState<string[]>([]);
  const [wishIds, setWishIds] = useState<string[]>(seed ? [seed.id] : []);
  const [lp, setLp] = useState(false);
  const [lt, setLt] = useState<"bk" | "wish" | "shop">("bk");
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => dayEvents.filter((e) => (day === "none" ? !e.day : e.day === day)).sort(byEv), [dayEvents, day]);
  // 시간을 넣으면 그 시간대 자리로 자동, 시간이 없으면 직접 고른 자리 (기본은 맨 끝)
  const hasTime = parseTime(time) != null;
  const at = hasTime ? autoAt(list, time) : slot ?? list.length;
  const name = title.trim() || "새 일정";
  const q = title.trim();
  const sugF = frequent.filter((s) => !q || s.title.includes(q));
  const sugW = wishes.filter((s) => s.wk !== "shop" && (!q || s.title.includes(q)));

  function pickSug(s: LinkOpt, fromWish: boolean) {
    setTitle(s.title);
    if (s.cat) setCat(s.cat);
    if (s.address && !address) setAddress(s.address);
    if (s.link && !link) setLink(s.link);
    if (fromWish && !wishIds.includes(s.id)) setWishIds([...wishIds, s.id]);
    setOpen(false);
  }

  async function save() {
    if (!title.trim()) return toast("이름을 적어 주세요");
    setBusy(true);
    const sort = sortAt(list, at, time);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .insert({
        trip_id: tripId,
        title: title.trim(),
        category: cat,
        day: day === "none" ? null : day,
        time_text: time.trim() ? normTime(time) : null,
        sort,
        move_mode: move || null,
        move_note: move ? [normDur(moveDur), moveMemo.trim()].filter(Boolean).join(" · ") || null : null,
        memo: memo.trim() || null,
        address: address.trim() || null,
        link: link.trim() || null,
        booking_id: bookingIds[0] ?? null,
        wish_id: wishIds[0] ?? null,
        ...(bookingIds.length ? { booking_ids: bookingIds } : {}),
        ...(wishIds.length ? { wish_ids: wishIds } : {}),
      })
      .select("id")
      .single();
    if (error || !data) {
      setBusy(false);
      return toast("저장하지 못했어요");
    }
    if (file) {
      try {
        const url = await uploadPhoto(tripId, file);
        await supabase.from("events").update({ photo: url }).eq("id", data.id);
      } catch {
        toast("사진을 올리지 못했어요");
      }
    }
    router.replace(`/trips/${tripId}/plan?day=${day}`);
    router.refresh();
  }

  const bks = bookingIds.map((id) => bookings.find((b) => b.id === id)).filter((x): x is LinkOpt => !!x);
  const wis = wishIds.map((id) => wishes.find((w) => w.id === id)).filter((x): x is LinkOpt => !!x);

  return (
    <section className="screen on hasbar" id="eventAdd">
      <div className="scr nonav">
        <div className="hd">
          <Go as="span" className="ib" back>
            <Ic n="x" />
          </Go>
          <h2>일정 추가</h2>
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          <div className="form" style={{ marginTop: -8 }}>
            <label>이름</label>
            <div className={`nmwrap${open && (sugF.length || sugW.length) ? " open" : ""}`}>
              <textarea
                className="nminp"
                rows={2}
                value={title}
                placeholder="일정 이름"
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                onChange={(e) => {
                  setTitle(e.target.value.replace(/\n/g, ""));
                  setOpen(true);
                }}
                style={{ width: "100%", resize: "none", display: "block", font: "inherit" }}
              />
              <div className="sugg">
                {sugF.length > 0 && (
                  <div className="sg-h row">
                    자주 가는 장소
                    {sugF.length > 3 && (
                      <span className="sg-more" onMouseDown={(e) => (e.preventDefault(), setMore({ ...more, f: !more.f }))}>
                        <Ic n={more.f ? "x" : "plus"} />
                      </span>
                    )}
                  </div>
                )}
                {(more.f || q ? sugF : sugF.slice(0, 3)).map((s) => (
                  <div key={`f${s.id}`} className="sg" onMouseDown={(e) => (e.preventDefault(), pickSug(s, false))}>
                    <span className={`evi ${evCat(s.cat ?? "기타").evi} xs`}>
                      <Ic n={evCat(s.cat ?? "기타").ic} />
                    </span>
                    <b>{s.title}</b>
                    <em>{s.cat}</em>
                  </div>
                ))}
                {sugW.length > 0 && (
                  <div className="sg-h row">
                    가고싶은곳
                    {sugW.length > 3 && (
                      <span className="sg-more" onMouseDown={(e) => (e.preventDefault(), setMore({ ...more, w: !more.w }))}>
                        <Ic n={more.w ? "x" : "plus"} />
                      </span>
                    )}
                  </div>
                )}
                {(more.w || q ? sugW : sugW.slice(0, 3)).map((s) => (
                  <div key={`w${s.id}`} className="sg" onMouseDown={(e) => (e.preventDefault(), pickSug(s, true))}>
                    <span className={`evi ${evCat(s.cat ?? "기타").evi} xs`}>
                      <Ic n={evCat(s.cat ?? "기타").ic} />
                    </span>
                    <b>{s.title}</b>
                    <em>{s.cat}</em>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <label className="flab row">
            분류
            <span className="catmore" onClick={() => setCatAll(!catAll)}>
              <Ic n={catAll ? "x" : "plus"} /> {catAll ? "접기" : "더보기"}
            </span>
          </label>
          <div className={`catpick${catAll ? "" : " folded"}`}>
            {EV_CATS.map((c) => (
              <div key={c.key} className={cat === c.key ? "on" : ""} onClick={() => setCat(c.key)}>
                <Ic n={c.key === "체험" ? "sparkles" : c.key === "기타" ? "ellipsis" : c.ic} />
                <span>{c.key}</span>
              </div>
            ))}
          </div>

          <label className="flab">날짜</label>
          <div className="dcks">
            {days.map((d, i) => (
              <div key={d} className={`dck${day === d ? " on" : ""}`} onClick={() => (setDay(d), setSlot(null))}>
                <span>DAY {i + 1}</span>
                <b>
                  {parseDate(d).getMonth() + 1}/{parseDate(d).getDate()}
                </b>
              </div>
            ))}
            <div className={`dck${day === "none" ? " on" : ""}`} onClick={() => (setDay("none"), setSlot(null))}>
              <span>날짜</span>
              <b>미정</b>
            </div>
          </div>

          <label className="flab">
            시간{" "}
            <span className="sub" style={{ fontWeight: 500 }}>
              선택
            </span>
          </label>
          <div className="inp row tin tinput">
            <Ic n="clock-3" />
            <TimeInput className="tedit" value={time} onChange={(v) => setTime(v)} placeholder="예) 2130 → 21:30" style={{ flex: 1, border: 0, outline: 0, background: "none" }} />
          </div>

          {list.length > 0 && (
            <>
              <label className="flab">순서</label>
              <div className="wlist">
                {Array.from({ length: list.length + 1 }).map((_, i) => (
                  <Fragment key={i}>
                    {(i > 0 || at === 0) && (
                    <div className={`wslot${at === i ? " on" : ""}`} onClick={() => (hasTime ? toast("시간을 지우면 자리를 직접 고를 수 있어요") : setSlot(i))}>
                      <i className="ck" />
                      <span className="wh">여기에 넣기</span>
                      <span className="wn">{name}</span>
                      {at === i && (
                        <i className="grip">
                          <Ic n="grip-vertical" />
                        </i>
                      )}
                    </div>
                    )}
                    {list[i] && (
                      <div className="wl">
                        <span className="t">{normTime(list[i].time_text)}</span>
                        <b>{list[i].title}</b>
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </>
          )}

          <label className="flab" id="move">
            가는 방법
          </label>
          <div className="modes" style={{ gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
            {MOVES.map(([k, n, l]) => (
              <div key={k} className={move === k ? "on" : ""} onClick={() => setMove(move === k ? "" : k)}>
                <Ic n={n} />
                <b>{l}</b>
              </div>
            ))}
          </div>
          {move && (
            <div className="form tight" style={{ marginTop: 8 }}>
              <div className="inp row">
                <span style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
                  <Ic n="clock-3" /> 이동 시간
                </span>
                <input value={moveDur} onChange={(e) => setMoveDur(e.target.value)} placeholder={move === "flight" ? "1시간 30분" : "30분"} style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", textAlign: "right", fontWeight: 700 }} />
              </div>
              <div className="inp row" style={{ alignItems: "flex-start" }}>
                <Ic n="pencil" style={{ marginTop: 3 }} />
                <textarea value={moveMemo} onChange={(e) => setMoveMemo(e.target.value)} rows={moveMemo ? 3 : 1} placeholder={move === "flight" ? "이동 메모 · 예) 7C1471, 2터미널" : "이동 메모 · 예) 1인 ¥500, 교통카드 ¥480"} style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", resize: "none", font: "inherit", lineHeight: 1.5 }} />
              </div>
            </div>
          )}

          <div className="form tight">
            <div className="inp row">
              <Ic n="map-pin" />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소 · 선택" style={{ flex: 1, border: 0, outline: 0, background: "none" }} />
            </div>
            <div className="inp row" style={{ alignItems: "flex-start" }}>
              <Ic n="pencil" style={{ marginTop: 3 }} />
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={memo ? 3 : 1} placeholder="메모 (가격, 대안 시간 등)" style={{ flex: 1, border: 0, outline: 0, background: "none", resize: "none", font: "inherit", lineHeight: 1.5 }} />
            </div>
            <div className="inp row">
              <Ic n="link" />
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="링크 · 선택 (예약 페이지, 블로그)" inputMode="url" style={{ flex: 1, border: 0, outline: 0, background: "none" }} />
            </div>
            <label className="inp row" style={{ cursor: "pointer", margin: "8px 0 0", fontSize: 14.5, fontWeight: 400, color: "inherit" }}>
              <span>
                <Ic n="camera" /> {file ? file.name : "사진"} <span className="sub">(선택)</span>
              </span>
              <Ic n={file ? "check" : "plus"} />
              <input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {(bookings.length > 0 || wishes.length > 0) && (
            <>
              <label className="flab">
                연결{" "}
                <span className="sub" style={{ fontWeight: 500 }}>
                  선택
                </span>
              </label>
              <div className="lkbox">
                {bks.map((bk) => (
                  <div key={bk.id} className="lkc k-bk">
                    <Ic n={bk.ic ?? "ticket"} />
                    <span>
                      <em>예약</em>
                      {bk.title}
                    </span>
                    <b className="x" onClick={() => setBookingIds(bookingIds.filter((x) => x !== bk.id))}>
                      <Ic n="x" />
                    </b>
                  </div>
                ))}
                {wis.map((wi) => (
                  <div key={wi.id} className="lkc k-wish">
                    <Ic n={wi.wk === "shop" ? "shopping-bag" : "heart"} />
                    <span>
                      <em>{wi.wk === "shop" ? "쇼핑" : "가고싶은곳"}</em>
                      {wi.title}
                    </span>
                    <b className="x" onClick={() => setWishIds(wishIds.filter((x) => x !== wi.id))}>
                      <Ic n="x" />
                    </b>
                  </div>
                ))}
                <div className="lkadd" onClick={() => setLp(true)}>
                  <Ic n={bks.length + wis.length ? "plus" : "link-2"} /> {bks.length + wis.length ? "더 연결" : "예약 · 위시리스트 연결"}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <LinkPick open={lp} onClose={() => setLp(false)} tab={lt} setTab={setLt} bookings={bookings} wishes={wishes} bookingIds={bookingIds} wishIds={wishIds} setBookingIds={setBookingIds} setWishIds={setWishIds} />
      <SaveBar on={!!title.trim()} busy={busy} onSave={save} />
    </section>
  );
}

export function LinkPick({
  open,
  onClose,
  tab,
  setTab,
  bookings,
  wishes,
  bookingIds,
  wishIds,
  setBookingIds,
  setWishIds,
}: {
  open: boolean;
  onClose: () => void;
  tab: "bk" | "wish" | "shop";
  setTab: (t: "bk" | "wish" | "shop") => void;
  bookings: LinkOpt[];
  wishes: LinkOpt[];
  bookingIds: string[];
  wishIds: string[];
  setBookingIds: (v: string[]) => void;
  setWishIds: (v: string[]) => void;
}) {
  const src = tab === "bk" ? bookings : wishes.filter((w) => (tab === "shop" ? w.wk === "shop" : w.wk !== "shop"));
  const cur = tab === "bk" ? bookingIds : wishIds;
  const set = tab === "bk" ? setBookingIds : setWishIds;
  const n = bookingIds.length + wishIds.length;
  const cnt = (t: "bk" | "wish" | "shop") => (t === "bk" ? bookingIds.length : wishIds.filter((id) => wishes.find((w) => w.id === id && (t === "shop" ? w.wk === "shop" : w.wk !== "shop"))).length);
  return (
    <Sheet open={open} onClose={onClose} title="연결하기" id="linkPick">
      <div className="lk-tabs">
        {(
          [
            ["bk", "예약"],
            ["wish", "가고싶은곳"],
            ["shop", "쇼핑"],
          ] as const
        ).map(([k, l]) => (
          <span key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {l}
            {cnt(k) ? ` ${cnt(k)}` : ""}
          </span>
        ))}
      </div>
      <div className="lk-list">
        {src.length === 0 && <div className="noresult" style={{ display: "block" }}>{tab === "bk" ? "예약이 없어요" : tab === "shop" ? "쇼핑 항목이 없어요" : "가고싶은곳이 없어요"}</div>}
        {src.map((it) => {
          const on = cur.includes(it.id);
          return (
            <div key={it.id} className={`lk-i${on ? " on" : ""}`} onClick={() => set(on ? cur.filter((x) => x !== it.id) : [...cur, it.id])}>
              <span className={`evi ${it.c ?? (tab === "bk" ? "blue" : "acc")} xs`}>
                <Ic n={it.ic ?? (tab === "bk" ? "ticket" : "heart")} />
              </span>
              <div className="mid">
                <b>{it.title}</b>
                <span>{it.sub ?? ""}</span>
              </div>
              <i className="ck" />
            </div>
          );
        })}
      </div>
      <div
        className="bigbtn"
        onClick={() => {
          onClose();
          if (n) toast(`${n}개 연결했어요`);
        }}
      >
        {n ? `${n}개 연결하기` : "연결하기"}
      </div>
    </Sheet>
  );
}
