"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BOOKING_KINDS, bookingTitle, flightKo, sortKey } from "@/lib/booking";
import { removePhotos } from "@/lib/photo";
import { syncFlight } from "@/lib/flightsync";
import { sym } from "@/lib/money";
import { normTime, parseTime } from "@/lib/format";
import { askDel, toast } from "@/lib/ui";
import Go from "@/components/Go";
import SaveBar from "@/components/ui/SaveBar";
import Ic, { type IcName } from "@/components/Ic";
import DatePick from "@/components/ui/DatePick";
import TimeInput from "@/components/ui/TimeInput";
import PhotoField from "@/components/ui/PhotoField";
import type { Booking, BookingKind, Pocket } from "@/lib/types";

const KIND_IC: Record<BookingKind, IcName> = { flight: "plane", hotel: "bed-double", car: "car", restaurant: "utensils", tour: "ticket", etc: "ellipsis" };
const EXP_CAT: Record<BookingKind, string> = { flight: "교통", hotel: "숙소", car: "교통", restaurant: "식비", tour: "기타", etc: "기타" };
const POCKET_IC: Record<string, IcName> = { cash: "banknote", card: "credit-card", bank: "landmark" };
const WK = ["일", "월", "화", "수", "목", "금", "토"];
const dlabel = (d?: string, t?: string) => {
  if (!d) return "";
  const [y, m, dd] = d.split("-").map(Number);
  return `${m}/${dd} (${WK[new Date(y, m - 1, dd).getDay()]})${t ? ` ${t}` : ""}`;
};

type Props = {
  tripId: string;
  tripCurrency: string;
  memberIds: string[];
  me: string;
  pockets: Pocket[];
  days: string[];
  booking?: Booking;
  defaultKind?: BookingKind;
};

export default function BookingForm({ tripId, tripCurrency, memberIds, me, pockets, days, booking, defaultKind }: Props) {
  const router = useRouter();
  const edit = !!booking;
  const [kind, setKind] = useState<BookingKind>(booking?.kind ?? defaultKind ?? "flight");
  const [title, setTitle] = useState(booking?.title ?? "");
  const [d, setD] = useState<Record<string, string>>(booking?.details ?? {});
  const [status, setStatus] = useState(booking?.status ?? "예약 완료");
  const [amount, setAmount] = useState(booking?.amount != null ? String(booking.amount) : "");
  const [cur, setCur] = useState(booking?.currency ?? (kind === "hotel" || kind === "car" ? tripCurrency : "KRW"));
  const [memo, setMemo] = useState(booking?.memo ?? "");
  const [link, setLink] = useState(booking?.link ?? "");
  const [photos, setPhotos] = useState<string[]>(booking?.photos ?? []);
  const [rec, setRec] = useState(true);
  const [pocket, setPocket] = useState<string>("");
  const [toPlan, setToPlan] = useState(true);
  const [toPack, setToPack] = useState(true);
  const [dp, setDp] = useState<"" | string>("");
  const [busy, setBusy] = useState(false);
  const snap = JSON.stringify([kind, title, d, status, amount, cur, memo, link, photos]);
  const [snap0] = useState(snap);
  const changed = snap !== snap0;
  const [uploading, setUploading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value });
  const amt = Number(amount.replace(/,/g, "")) || 0;
  const curs = Array.from(new Set(["KRW", tripCurrency]));

  const F = (k: string, label: string, ph = "", sub?: string) => (
    <div>
      <label>
        {label} {sub && <span className="sub">{sub}</span>}
      </label>
      {/(_time|^boarding)$/.test(k) ? (
        <TimeInput className="inp" value={d[k] ?? ""} onChange={(v) => setD((o) => ({ ...o, [k]: v }))} placeholder={ph.replace(":", "")} />
      ) : (
        <input className="inp" value={d[k] ?? ""} onChange={set(k)} placeholder={ph} />
      )}
    </div>
  );
  const T = (label: string, ph = "") => (
    <>
      <label>{label}</label>
      <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={ph} />
    </>
  );
  const DateRow = (dk: string, tk: string | null, label: string, extra?: string) => (
    <div>
      <label>{label}</label>
      <div className="inp row" onClick={() => setDp(`${dk}|${tk ?? ""}`)} style={{ cursor: "pointer" }}>
        <span>
          {d[dk] ? dlabel(d[dk], tk ? d[tk] : undefined) : <span className="sub">날짜 고르기</span>}
          {extra && d[extra] && (
            <>
              <br />
              <span className="sub">{d[extra]}</span>
            </>
          )}
        </span>
        <Ic n="calendar-days" />
      </div>
    </div>
  );

  const Amount = (
    <>
      <label>금액</label>
      <div className="inp row" style={{ padding: "8px 8px 8px 15px" }}>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", fontSize: 15, fontWeight: 700 }} />
        <div className="segm" style={{ width: 110, flex: "none" }}>
          {curs.map((c) => (
            <span key={c} className={cur === c ? "on" : ""} onClick={() => setCur(c)} style={{ padding: "6px 0" }}>
              {sym(c).trim()} {c}
            </span>
          ))}
        </div>
      </div>
      {!edit && amt > 0 && (
        <div className={`pkrec${rec ? " on" : ""}`}>
          <div className="pkrow" onClick={() => setRec(!rec)} style={{ cursor: "pointer" }}>
            <Ic n="wallet" />
            <span>경비에 기록</span>
            <i className={`sw${rec ? " on" : ""}`} />
          </div>
          {rec && (
            <div className="pkchips">
              <span className={`pkc${pocket === "" ? " on" : ""}`} onClick={() => setPocket("")}>
                <Ic n="users" /> 내가 내고 나눠요
              </span>
              {pockets.map((p) => (
                <span key={p.id} className={`pkc${pocket === p.id ? " on" : ""}`} onClick={() => setPocket(p.id)}>
                  <Ic n={p.shared ? "users" : POCKET_IC[p.kind]} /> {p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  const Attach = (label: string) => (
    <>
      <label>
        {label} <span className="sub">선택</span>
      </label>
      <PhotoField tripId={tripId} value={photos} onChange={setPhotos} onBusy={setUploading} label="추가" />
    </>
  );

  const Sw = (on: boolean, flip: () => void, ic: IcName, text: string) => (
    <div onClick={flip} style={{ cursor: "pointer" }}>
      <Ic n={ic} />
      <span>{text}</span>
      <i className={`sw${on ? " on" : ""}`} />
    </div>
  );

  function canSave() {
    if (kind === "flight") return !!(d.from || d.to || d.flight_no || d.airline);
    return !!title.trim();
  }

  async function save() {
    if (!canSave()) return toast(kind === "flight" ? "출발 · 도착을 적어 주세요" : "이름을 적어 주세요");
    setBusy(true);
    const supabase = createClient();
    const details = Object.fromEntries(Object.entries(d).filter(([, v]) => v !== ""));
    const name = kind === "flight" ? [d.airline, d.flight_no].filter(Boolean).join(" ") || bookingTitle({ kind, details, title: "" }) || "항공권" : title.trim();
    const row = {
      trip_id: tripId,
      kind,
      title: name,
      status: kind === "restaurant" ? status : booking?.status && kind === booking.kind ? booking.status : "예약 완료",
      details,
      amount: amount ? amt : null,
      currency: amount ? cur : null,
      memo: memo.trim() || null,
      link: link.trim() || null,
      photos,
      sort_key: sortKey({ kind, details }),
    };
    let id = booking?.id;
    if (edit) {
      const { error } = await supabase.from("bookings").update(row).eq("id", id!);
      if (error) return fail();
      const gone = (booking!.photos || []).filter((p) => !photos.includes(p));
      if (gone.length) removePhotos(gone);
      // 항공권을 고치면 연결된 출발 · 도착 일정도 맞춰요
      await syncFlight(supabase, { ...booking!, ...row, details } as Booking, days);
    } else {
      const { data, error } = await supabase.from("bookings").insert(row).select("id").single();
      if (error || !data) return fail();
      id = data.id;
      const tasks: PromiseLike<unknown>[] = [];
      // 경비 기록
      if (rec && amt > 0) {
        const pk = pockets.find((p) => p.id === pocket);
        tasks.push(
          supabase.from("expenses").insert({
            trip_id: tripId,
            pocket_id: pk?.id ?? null,
            payer_id: pk?.shared ? null : pk?.owner_id ?? me,
            amount: amt,
            currency: cur,
            category: EXP_CAT[kind],
            title: name,
            day: null,
            split: pk ? null : memberIds.length > 1 ? { members: memberIds } : null,
            booking_id: id,
          }),
        );
      }
      // 일정에 넣기
      if (toPlan) {
        const inTrip = (x?: string) => (x && days.includes(x) ? x : null);
        const ev = (day: string | undefined, time: string | undefined, t: string, category: string, address?: string) => ({
          trip_id: tripId,
          booking_id: id,
          day: inTrip(day),
          time_text: time ? normTime(time) : null,
          sort: (parseTime(time) ?? 1500) + Math.random() / 100,
          title: t,
          category,
          address: address || null,
        });
        const evs =
          kind === "flight"
            ? [ev(d.date, d.from_time, `${d.from || "출발"} 출발`, "교통", name), ...(d.to_time ? [{ ...ev(d.date, d.to_time, `${d.to || "도착"} 도착`, "교통", name), move_mode: "flight", move_note: flightKo(d.from_time, d.to_time) || null }] : [])]
            : kind === "hotel"
              ? [ev(d.checkin, d.checkin_time, "호텔 체크인", "숙소", name), ev(d.checkout, d.checkout_time, "체크아웃", "숙소", name)]
              : kind === "car"
                ? [ev(d.pickup_date, d.pickup_time, `렌터카 픽업 · ${name}`, "교통", d.pickup), ev(d.dropoff_date, d.dropoff_time, `렌터카 반납 · ${name}`, "교통", d.dropoff)]
                : [ev(d.date, d.time, name, kind === "restaurant" ? "음식점" : kind === "tour" ? "체험" : "기타", d.address)];
        tasks.push(supabase.from("events").insert(evs.filter((x) => x.day || kind === "etc")));
      }
      // 준비물
      if (toPack && (kind === "hotel" || kind === "car")) {
        tasks.push(supabase.from("pack_items").insert({ trip_id: tripId, category: "필수", name: kind === "hotel" ? "숙소 바우처" : "국제운전면허증", booking_id: kind === "hotel" ? id : null, sort: Date.now() / 1e10 }));
      }
      await Promise.all(tasks);
    }
    router.replace(`/trips/${tripId}/bookings/${id}`);
    router.refresh();
  }
  function fail() {
    setBusy(false);
    toast("저장하지 못했어요");
  }

  async function remove() {
    if (!booking || !(await askDel("이 예약을 지울까요?", "일정에 들어간 항목은 남고 연결만 풀려요"))) return;
    const { error } = await createClient().from("bookings").delete().eq("id", booking.id);
    if (error) return toast("지우지 못했어요");
    removePhotos(booking.photos || []);
    toast("예약을 지웠어요");
    router.replace(`/trips/${tripId}/bookings`);
    router.refresh();
  }

  const [dk, tk] = dp.split("|");
  const opts = (d.options || "").split(",").filter(Boolean);

  return (
    <section className="screen on hasbar" id="bookAdd">
      <div className="scr nonav">
        <div className="hd">
          <Go as="span" className="ib" back>
            <Ic n="x" />
          </Go>
          <h2>{edit ? "예약 수정" : "예약 추가"}</h2>
        </div>
        <div className="pad" style={{ paddingBottom: 28 }}>
          <div className="typeg">
            {BOOKING_KINDS.map((k) => (
              <div key={k.key} className={kind === k.key ? "on" : ""} onClick={() => setKind(k.key)}>
                <Ic n={KIND_IC[k.key]} />
                <span>{k.label}</span>
              </div>
            ))}
          </div>

          {kind === "flight" && (
            <div className="form">
              <div className="two">
                {F("airline", "항공사", "제주항공")}
                {F("flight_no", "편명", "7C1471")}
              </div>
              <div className="two">
                {F("from", "출발", "인천 T1")}
                {F("from_time", "시간", "11:10")}
              </div>
              <div className="two">
                {F("to", "도착", "후쿠오카")}
                {F("to_time", "시간", "12:40")}
              </div>
              {DateRow("date", null, "날짜")}
              {F("pnr", "예약번호", "JR8K2Q")}
              <div className="two">
                {F("pax", "탑승객", "3명")}
                {F("seat", "좌석", "14A · B · C")}
              </div>
              <div className="two">
                {F("boarding", "탑승 시작", "10:40")}
                {F("bag", "수하물", "15kg")}
              </div>
              {Amount}
              {Attach("탑승권 · e티켓 캡처")}
            </div>
          )}

          {kind === "hotel" && (
            <div className="form">
              {T("숙소 이름", "베스트 웨스턴 플러스 텐진-미나미")}
              {F("address", "주소", "3-8-3 Watanabedori, Chuo Ward", "선택")}
              {F("phone", "전화", "+81 92-000-0000", "선택")}
              <div className="two">
                {DateRow("checkin", "checkin_time", "체크인")}
                {DateRow("checkout", "checkout_time", "체크아웃")}
              </div>
              <div className="two">
                {F("room", "객실", "트윈 + 엑스트라")}
                {F("pax", "인원", "3명")}
              </div>
              <div className="two">
                {F("pnr", "예약번호", "BW-48213")}
                {F("site", "예약한 곳", "부킹닷컴")}
              </div>
              <label>결제</label>
              <div className="segm">
                {["선결제", "현장결제"].map((x) => (
                  <span key={x} className={(d.pay || "선결제") === x ? "on" : ""} onClick={() => setD({ ...d, pay: x })}>
                    {x}
                  </span>
                ))}
              </div>
              {Amount}
              {F("cancel", "무료 취소 기한", "10/7 (수) 23:59까지", "선택")}
              {Attach("바우처")}
            </div>
          )}

          {kind === "car" && (
            <div className="form">
              {T("업체", "타임즈카 렌터카")}
              <div className="two">
                {DateRow("pickup_date", "pickup_time", "픽업", "pickup")}
                {DateRow("dropoff_date", "dropoff_time", "반납", "dropoff")}
              </div>
              <div className="two">
                {F("pickup", "픽업 장소", "후쿠오카공항점")}
                {F("dropoff", "반납 장소", "후쿠오카공항점")}
              </div>
              <div className="two">
                {F("model", "차종", "컴팩트 (5인승)")}
                {F("pnr", "예약번호", "TC-20931")}
              </div>
              <label>보험 · 옵션</label>
              <div className="chips flush" style={{ marginTop: 0 }}>
                {["면책보험", "ETC 카드", "카시트", "내비 한국어"].map((o) => (
                  <span key={o} className={`chip${opts.includes(o) ? " on" : ""}`} onClick={() => setD({ ...d, options: (opts.includes(o) ? opts.filter((x) => x !== o) : [...opts, o]).join(",") })}>
                    {o}
                  </span>
                ))}
              </div>
              {Amount}
            </div>
          )}

          {kind === "restaurant" && (
            <div className="form">
              {T("식당", "히키니쿠토코메 하카타")}
              <div className="two">
                {DateRow("date", "time", "날짜 · 시간")}
                {F("pax", "인원", "3명")}
              </div>
              <label>예약 상태</label>
              <div className="rstate">
                {(
                  [
                    ["예약 완료", "circle-check"],
                    ["예약 오픈 대기", "calendar-clock"],
                    ["현장 줄서기", "users"],
                  ] as [string, IcName][]
                ).map(([s, n]) => (
                  <div key={s} className={status === s ? "on" : ""} onClick={() => setStatus(s)}>
                    <Ic n={n} />
                    <b>{s}</b>
                  </div>
                ))}
              </div>
              {status === "예약 완료" && <div className="two" style={{ marginTop: 10 }}>{F("pnr", "예약번호", "")}{F("booked_at", "예약한 날", "10/4 00:02")}</div>}
              {status === "예약 오픈 대기" && (
                <div className="openbox">
                  <b>
                    <Ic n="calendar-clock" /> 예약 오픈
                  </b>
                  <div className="two" style={{ marginTop: 8 }}>
                    <input className="inp" value={d.open_at ?? ""} onChange={set("open_at")} placeholder="10/4 (토) 00:00" />
                    <input className="inp" value={d.open_rule ?? ""} onChange={set("open_rule")} placeholder="7일 전" />
                  </div>
                </div>
              )}
              {status === "현장 줄서기" && F("wait", "웨이팅 메모", "오픈 30분 전 도착 · 번호표")}
              <label>예약 방법</label>
              <input className="inp" value={link} onChange={(e) => setLink(e.target.value)} placeholder="예약 페이지 링크" inputMode="url" />
              <label>메모</label>
              <textarea className="inp" rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="함박스테이크 · 밥 무한리필" />
              {Amount}
            </div>
          )}

          {kind === "tour" && (
            <div className="form">
              {T("이름", "다자이후 · 야나가와 버스 투어")}
              <div className="two">
                {DateRow("date", "time", "날짜 · 시간")}
                {F("pax", "인원", "3명")}
              </div>
              {F("address", "모이는 곳", "하카타역 치쿠시구치")}
              {F("pnr", "예약한 곳 · 예약번호", "클룩 · KL-778120")}
              {Amount}
              {Attach("티켓 (QR)")}
            </div>
          )}

          {kind === "etc" && (
            <div className="form">
              {T("이름", "eSIM · 포켓와이파이 등")}
              {DateRow("date", null, "날짜")}
              <label>예약번호 · 메모</label>
              <textarea className="inp" rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="자유롭게 적어요" />
              {Amount}
              {Attach("첨부")}
            </div>
          )}

          {kind !== "restaurant" && kind !== "etc" && (
            <div className="form">
              <label>
                메모 · 링크 <span className="sub">선택</span>
              </label>
              {<textarea className="inp" rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="취소 규정, 준비할 것" />}
              <input className="inp" style={{ marginTop: 8 }} value={link} onChange={(e) => setLink(e.target.value)} placeholder="예약 확인 페이지 링크" inputMode="url" />
            </div>
          )}

          {!edit && (
            <div className="switches">
              {Sw(toPlan, () => setToPlan(!toPlan), "calendar-days", kind === "flight" ? "출발·도착을 일정에 추가" : kind === "hotel" ? "체크인·체크아웃을 일정에 추가" : kind === "car" ? "픽업·반납을 일정에 추가" : "일정에 추가")}
              {kind === "hotel" && Sw(toPack, () => setToPack(!toPack), "luggage", '준비물에 "숙소 바우처" 추가')}
              {kind === "car" && Sw(toPack, () => setToPack(!toPack), "luggage", '준비물에 "국제운전면허증" 추가')}
            </div>
          )}

          {edit && (
            <div className="dellink" onClick={remove}>
              <Ic n="trash" /> 예약 삭제
            </div>
          )}
        </div>
      </div>
      <DatePick
        open={!!dp}
        onClose={() => setDp("")}
        mode="single"
        a={d[dk] || days[0] || null}
        time={tk ? d[tk] : undefined}
        withTime={!!tk}
        onDone={(a, _b, t) => setD({ ...d, [dk]: a ?? "", ...(tk ? { [tk]: t } : {}) })}
      />
      <SaveBar on={(!booking || changed) && canSave() && !uploading} busy={busy} onSave={save} />
    </section>
  );
}
