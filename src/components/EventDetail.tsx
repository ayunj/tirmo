"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EV_CATS, evCat } from "@/lib/cats";
import { normTime, parseTime } from "@/lib/format";
import TimeInput from "@/components/ui/TimeInput";
import { uploadPhoto, removePhotos } from "@/lib/photo";
import { askDel, toast } from "@/lib/ui";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import Sheet from "@/components/ui/Sheet";
import { LinkPick, type LinkOpt } from "@/components/EventForm";
import type { EventRow } from "@/lib/types";


type Rec = { id: string; body: string | null; title: string | null; photos: string[]; day: string | null; time_text: string | null };

/** 일정 상세 (목업 place). 고친 뒤 저장 버튼으로 저장 */
export default function EventDetail({ ev, days, bookings, wishes, records, putDay }: { ev: EventRow; days: string[]; bookings: (LinkOpt & { status?: string })[]; wishes: LinkOpt[]; records: Rec[]; putDay?: string }) {
  const router = useRouter();
  const [e, setE] = useState<EventRow>(putDay ? { ...ev, day: putDay } : ev);
  const [editTitle, setEditTitle] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [lp, setLp] = useState(false);
  const [lt, setLt] = useState<"bk" | "wish">("bk");
  const [up, setUp] = useState(false);
  const [tm, setTm] = useState(normTime(ev.time_text));
  const c = evCat(e.category);
  const tid = e.trip_id;
  const bk = bookings.find((b) => b.id === e.booking_id);
  const wi = wishes.find((w) => w.id === e.wish_id);

  // 고친 내용은 모아 두었다가 '저장'을 눌러야 저장돼요
  const [saved, setSaved] = useState<EventRow>(ev);
  const [busy, setBusy] = useState(false);
  const KEYS = ["title", "category", "day", "time_text", "memo", "address", "link", "booking_id", "wish_id", "photo"] as const;
  const diff = Object.fromEntries(KEYS.filter((k) => (e[k] ?? null) !== (saved[k] ?? null)).map((k) => [k, e[k] ?? null])) as Partial<EventRow>;
  const dirty = Object.keys(diff).length > 0;
  function patch(p: Partial<EventRow>) {
    setE((x) => ({ ...x, ...p }));
  }
  async function save() {
    if (!dirty || busy) return;
    setBusy(true);
    const row: Record<string, unknown> = { ...diff };
    if ("time_text" in diff) {
      const v = parseTime(diff.time_text);
      if (v != null) row.sort = v + Math.random() / 100;
    }
    const { error } = await createClient().from("events").update(row).eq("id", e.id);
    setBusy(false);
    if (error) return toast("저장하지 못했어요");
    if ("photo" in diff && saved.photo) removePhotos([saved.photo]);
    setSaved(e);
    toast("저장했어요");
    router.refresh();
  }
  /** 링크를 누를 때 저장 안 한 게 있으면 막고 물어보기 */
  function guard(x: React.MouseEvent<HTMLElement>) {
    if (!dirty) return;
    x.preventDefault();
    const href = x.currentTarget.getAttribute("data-href");
    if (href) leave(() => router.push(href));
  }
  /** 저장 안 한 게 있으면 물어보고 이동 */
  async function leave(go: () => void) {
    if (dirty && !(await askDel("저장하지 않고 나갈까요?", "고친 내용이 사라져요", "나가기"))) return;
    go();
  }

  async function remove() {
    if (!(await askDel("일정에서 뺄까요?", "기록과 지출은 남아 있어요", "빼기"))) return;
    const { error } = await createClient().from("events").delete().eq("id", e.id);
    if (error) return toast("지우지 못했어요");
    if (e.photo) removePhotos([e.photo]);
    toast("일정에서 뺐어요");
    router.replace(`/trips/${tid}/plan?day=${e.day ?? "none"}`);
    router.refresh();
  }

  async function photo(f: File) {
    setUp(true);
    try {
      const url = await uploadPhoto(tid, f);
      patch({ photo: url });
    } catch {
      toast("사진을 올리지 못했어요");
    }
    setUp(false);
  }

  const blurSave = (k: keyof EventRow) => (x: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = x.target.value.trim() || null;
    if (v !== (e[k] ?? null)) patch({ [k]: v } as Partial<EventRow>);
  };

  return (
    <section className="screen on" id="place">
      <div className="scr full nonav">
        <div className={`hero${e.photo ? "" : ` noimg k-${c.evi === "cafe" ? "cafe" : c.evi}`}`} id="plHero">
          {e.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="im" src={e.photo} alt="" />
          )}
          <div className="hero-ic">
            <Ic n={c.ic} />
          </div>
          <div className="grad" />
          <div className="cv-top">
            <span className="glass circ" onClick={() => leave(() => router.back())}>
              <Ic n="chevron-left" />
            </span>
            <label className="glass circ" style={{ cursor: "pointer" }}>
              <Ic n={up ? "clock-3" : "camera"} />
              <input type="file" accept="image/*" hidden onChange={(x) => x.target.files?.[0] && photo(x.target.files[0])} />
            </label>
          </div>
        </div>
        <div className="sheet">
          {editTitle ? (
            <input
              className="ptin"
              autoFocus
              defaultValue={e.title}
              onBlur={(x) => {
                setEditTitle(false);
                const v = x.target.value.trim();
                if (v && v !== e.title) patch({ title: v });
              }}
              onKeyDown={(x) => x.key === "Enter" && !x.nativeEvent.isComposing && (x.target as HTMLInputElement).blur()}
            />
          ) : (
            <h3 className="ptitle" id="plTitle" onClick={() => setEditTitle(true)}>
              {e.title}
            </h3>
          )}
          <div className="tags">
            <span className={`tag ${c.tag}`} onClick={() => setCatOpen(true)} style={{ cursor: "pointer" }}>
              <Ic n={c.ic} /> {e.category}
            </span>
          </div>

          {bk && (
            <Go onClick={guard} className={`plbk ${bk.status && bk.status !== "예약 완료" ? "wait" : "ok"}`} id="plBk" href={`/trips/${tid}/bookings/${bk.id}`}>
              <span className="bk-ic">
                <Ic n={bk.ic ?? "ticket"} />
              </span>
              <div className="mid">
                <b>{bk.title}</b>
                <span>{bk.sub}</span>
              </div>
              <em>
                예약 보기 <Ic n="chevron-right" />
              </em>
            </Go>
          )}
          {wi && (
            <Go onClick={guard} className="plbk ok" href={`/trips/${tid}/wish`}>
              <span className="bk-ic" style={{ background: "var(--acc-s)", color: "var(--acc)" }}>
                <Ic n="heart" />
              </span>
              <div className="mid">
                <b>{wi.title}</b>
                <span>가고싶은곳에서 온 일정</span>
              </div>
              <em>
                보기 <Ic n="chevron-right" />
              </em>
            </Go>
          )}

          <div className="myplan">
            <div className="mp-r first">
              <span className="mp-l">날짜</span>
              <div className="mp-days">
                {days.map((d, i) => (
                  <span key={d} className={e.day === d ? "on" : ""} onClick={() => patch({ day: d })}>
                    DAY {i + 1}
                  </span>
                ))}
                <span className={!e.day ? "on" : ""} onClick={() => patch({ day: null })}>
                  미정
                </span>
              </div>
            </div>
            <div className="mp-r">
              <span className="mp-l">시간</span>
              <div className="inp row tin tinput">
                <Ic n="clock-3" />
                <TimeInput className="tedit" value={tm} onChange={setTm} onDone={(v) => v !== (e.time_text ?? "") && patch({ time_text: v || null })} placeholder="예) 1430 → 14:30" style={{ flex: 1, border: 0, outline: 0, background: "none" }} />
              </div>
            </div>
            <div className="mp-r top">
              <span className="mp-l">메모</span>
              <textarea className="mp-memo" defaultValue={e.memo ?? ""} placeholder="가격, 대안, 참고할 점" onBlur={blurSave("memo")} rows={Math.max(2, (e.memo ?? "").split("\n").length)} style={{ border: 0, resize: "none", fontFamily: "inherit" }} />
            </div>
            <div className="mp-foot">
              <span className="mp-del" id="plDel" onClick={remove}>
                <Ic n="trash" /> 일정에서 빼기
              </span>
            </div>
          </div>

          <div className="mp2">
            <div className="mp-r first">
              <span className="mp-l">주소</span>
              <input className="mp-t" defaultValue={e.address ?? ""} placeholder="적어두고 싶으면" onBlur={blurSave("address")} style={{ border: 0, background: "none" }} />
            </div>
            <div className="mp-r">
              <span className="mp-l">링크</span>
              <div className="mp-link">
                <Ic n="link" />
                <input defaultValue={e.link ?? ""} placeholder="블로그, 예약 페이지" inputMode="url" onBlur={blurSave("link")} style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", font: "inherit" }} />
                {e.link && /^https?:\/\//.test(e.link) && (
                  <a href={e.link} target="_blank" rel="noreferrer">
                    <em>열기</em>
                  </a>
                )}
              </div>
            </div>
            <div className="mp-r">
              <span className="mp-l">오는 길</span>
              <Go className="mp-link" onClick={(x) => { if (dirty) { x.preventDefault(); leave(() => router.push(`/trips/${tid}/plan/${e.id}/move`)); } }} href={`/trips/${tid}/plan/${e.id}/move`}>
                <Ic n={e.move_mode === "flight" ? "plane" : e.move_mode === "walk" ? "footprints" : e.move_mode === "taxi" ? "car-taxi-front" : e.move_mode === "car" ? "car" : e.move_mode ? "train-front" : "plus"} />
                <span className={e.move_mode ? "" : "sub"}>{e.move_mode ? [{ flight: "비행기", walk: "도보", transit: "대중교통", taxi: "택시", car: "차" }[e.move_mode], e.move_note].filter(Boolean).join(" · ") : "이동 방법"}</span>
                <em>{e.move_mode ? "바꾸기" : "선택"}</em>
              </Go>
            </div>
            <div className="mp-r">
              <span className="mp-l">연결</span>
              <div className="mp-link" style={{ cursor: "pointer" }} onClick={() => setLp(true)}>
                <Ic n="link-2" />
                <span className={bk || wi ? "" : "sub"}>{[bk?.title, wi?.title].filter(Boolean).join(", ") || "예약 · 가고싶은곳"}</span>
                <em>{bk || wi ? "바꾸기" : "연결"}</em>
              </div>
            </div>
          </div>

          {records.length > 0 && (
            <>
              <div className="sech plrec">
                <b>이곳의 기록</b>
                <Go onClick={guard} as="span" href={`/trips/${tid}/diary/${records[0].id}`}>
                  {records.length}개 <Ic n="chevron-right" />
                </Go>
              </div>
              {records.map((r) => (
                <Go onClick={guard} key={r.id} className="drow plrec" href={`/trips/${tid}/diary/${r.id}`} style={{ marginBottom: 8 }}>
                  {r.photos[0] && (
                    <div className="th">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="im" src={r.photos[0]} alt="" />
                    </div>
                  )}
                  <div className="mid">
                    <div className="note" style={{ fontSize: 15, lineHeight: 1.35 }}>
                      {(r.title || r.body || "").slice(0, 40)}
                    </div>
                    <div className="s">
                      {r.day ? `${+r.day.split("-")[1]}/${+r.day.split("-")[2]}` : ""} {r.time_text ?? ""}
                      {r.photos.length ? ` · 사진 ${r.photos.length}장` : ""}
                    </div>
                  </div>
                </Go>
              ))}
            </>
          )}

          <div className="btns2">
            <Go onClick={guard} href={`/trips/${tid}/diary/write?event=${e.id}${e.day ? `&day=${e.day}` : ""}`}>
              <Ic n="square-pen" /> 기록 쓰기
            </Go>
            <Go onClick={guard} href={`/trips/${tid}/money/new?title=${encodeURIComponent(e.title)}${e.day ? `&day=${e.day}` : ""}`}>
              <Ic n="receipt" /> 지출 쓰기
            </Go>
          </div>
        </div>
      </div>

      <div className="savebar">
        <div className={`bigbtn${dirty ? "" : " off"}`} onClick={save}>
          {busy ? "저장 중…" : dirty ? "저장" : "저장됨"}
        </div>
      </div>

      <Sheet open={catOpen} onClose={() => setCatOpen(false)} title="분류">
        <div className="catpick" style={{ marginTop: 14 }}>
          {EV_CATS.map((x) => (
            <div
              key={x.key}
              className={e.category === x.key ? "on" : ""}
              onClick={() => {
                patch({ category: x.key });
                setCatOpen(false);
              }}
            >
              <Ic n={x.key === "체험" ? "sparkles" : x.key === "기타" ? "ellipsis" : x.ic} />
              <span>{x.key}</span>
            </div>
          ))}
        </div>
      </Sheet>
      <LinkPick
        open={lp}
        onClose={() => setLp(false)}
        tab={lt}
        setTab={setLt}
        bookings={bookings}
        wishes={wishes}
        bookingId={e.booking_id ?? ""}
        wishId={e.wish_id ?? ""}
        setBookingId={(v) => patch({ booking_id: v || null })}
        setWishId={(v) => patch({ wish_id: v || null })}
      />
    </section>
  );
}
