import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip";
import { airportCode, between, kindLabel, nights } from "@/lib/booking";
import { days, parseDate } from "@/lib/format";
import { money, sym, toKrw } from "@/lib/money";
import Go from "@/components/Go";
import { normTime } from "@/lib/format";
import Ic, { type IcName } from "@/components/Ic";
import { statusTag } from "@/components/BookingCards";
import { Captures, CopyBtn, DelBooking, ToPlan } from "@/components/BookingBits";
import type { Booking } from "@/lib/types";

const WK = ["일", "월", "화", "수", "목", "금", "토"];
const KIND_IC: Record<string, IcName> = { flight: "plane", hotel: "bed-double", car: "car", restaurant: "utensils", tour: "ticket", etc: "ellipsis" };
const dfull = (s: string) => {
  const x = parseDate(s);
  return `${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, "0")}.${String(x.getDate()).padStart(2, "0")} (${WK[x.getDay()]})`;
};
const dshort = (s?: string) => {
  if (!s) return "-";
  const x = parseDate(s);
  return `${x.getMonth() + 1}/${x.getDate()} (${WK[x.getDay()]})`;
};

export default async function BookingDetail({ params }: { params: Promise<{ id: string; bid: string }> }) {
  const { id, bid } = await params;
  const { supabase, trip, members } = await loadTrip(id);
  const [{ data }, ev, ex] = await Promise.all([
    supabase.from("bookings").select("*").eq("id", bid).eq("trip_id", id).maybeSingle(),
    supabase.from("events").select("id, day").eq("booking_id", bid).order("day"),
    supabase.from("expenses").select("id, pocket_id, payer_id, pockets(name, kind, shared)").eq("booking_id", bid),
  ]);
  if (!data) notFound();
  const b = data as Booking;
  const d = b.details || {};
  const ds = days(trip.start_date, trip.end_date);
  const linked = ev.data ?? [];
  const exp = (ex.data ?? [])[0] as unknown as { pockets: { name: string; kind: string; shared: boolean } | null; payer_id: string | null } | undefined;
  const krw = b.amount != null ? toKrw(Number(b.amount), b.currency || "KRW", trip) : 0;
  const n = members.length;
  const edit = `/trips/${id}/bookings/${bid}/edit`;

  const Money =
    b.amount != null ? (
      <div className="boxc" style={b.kind !== "flight" ? { background: "var(--bg)" } : undefined}>
        <div className="row">
          <span className="sub">{b.kind === "flight" ? "결제 금액" : "금액"}</span>
          <b>
            {money(Number(b.amount), sym(b.currency || "KRW"))}
            {d.pay ? ` · ${d.pay}` : ""}
            {b.kind === "flight" && d.pax ? <span className="sub"> / {d.pax}</span> : null}
          </b>
        </div>
        {(n > 1 || exp) && (
          <div className="row" style={{ marginTop: 6 }}>
            <span className="sub">{n > 1 ? `1인 ${money(krw / n, "₩")}` : b.currency !== "KRW" ? `≈ ${money(krw, "₩")}` : ""}</span>
            {exp &&
              (exp.pockets ? (
                <span className={`pk ${exp.pockets.shared ? "team" : exp.pockets.kind}`}>
                  <Ic n={exp.pockets.shared ? "users" : exp.pockets.kind === "card" ? "credit-card" : exp.pockets.kind === "bank" ? "landmark" : "banknote"} /> {exp.pockets.name}
                </span>
              ) : (
                <span className="pk team">
                  <Ic n="receipt" /> 경비에 기록됨
                </span>
              ))}
          </div>
        )}
      </div>
    ) : null;

  const Btns = (
    <div className="btns2">
      {linked.length ? (
        <Go href={`/trips/${id}/plan?day=${linked[0].day ?? "none"}`}>
          <Ic n="calendar-days" /> 일정에서 보기
        </Go>
      ) : (
        <ToPlan b={b} days={ds} />
      )}
      <Go href={`/trips/${id}/money?tab=list`}>
        <Ic n="receipt" /> 경비 내역
      </Go>
    </div>
  );

  if (b.kind === "flight") {
    const grid = [
      ["예약번호", d.pnr],
      ["탑승객", d.pax],
      ["좌석", d.seat],
      ["탑승 시작", d.boarding],
      ["게이트", d.gate],
      ["수하물", d.bag],
    ];
    return (
      <section className="screen on" id="bookDetail">
        <div className="scr nonav">
          <div className="hd">
            <Go as="span" className="ib" back>
              <Ic n="chevron-left" />
            </Go>
            <h2>항공권</h2>
            <Go as="span" className="ib" href={edit}>
              <Ic n="pencil" />
            </Go>
          </div>
          <div className="pad" style={{ paddingBottom: 24 }}>
            <div className="pass">
              <div className="ps-top">
                <div className="row" style={{ opacity: 0.75, fontSize: 12 }}>
                  <span>{[d.airline, d.flight_no].filter(Boolean).join(" · ")}</span>
                  <span>{d.date ? dfull(d.date) : ""}</span>
                </div>
                <div className="ps-rt">
                  <div>
                    <b>{airportCode(d.from) || "—"}</b>
                    <span>{d.from}</span>
                    <em>{normTime(d.from_time)}</em>
                  </div>
                  <div className="ps-mid">
                    <i />
                    <Ic n="plane" />
                    <i />
                    <span>{between(d.from_time, d.to_time)}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <b>{airportCode(d.to) || "—"}</b>
                    <span>{d.to}</span>
                    <em>{normTime(d.to_time)}</em>
                  </div>
                </div>
              </div>
              <div className="ps-cut" />
              <div className="ps-grid">
                {grid.map(([k, v]) => (
                  <div key={k}>
                    <span>{k}</span>
                    <b>{v || "—"}</b>
                  </div>
                ))}
              </div>
              <Captures b={b} />
            </div>
            {Money}
            {(b.memo || b.link) && (
              <div className="boxc">
                {b.memo && <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-line" }}>{b.memo}</div>}
                {b.link && /^https?:\/\//.test(b.link) && (
                  <a href={b.link} target="_blank" rel="noreferrer" className="link" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, marginTop: b.memo ? 8 : 0 }}>
                    <Ic n="arrow-up-right" /> 예약 페이지 열기
                  </a>
                )}
              </div>
            )}
            {Btns}
            <DelBooking b={b} />
          </div>
        </div>
      </section>
    );
  }

  // 숙소 · 렌터카 · 식당 · 투어 · 기타
  const kv: [IcName, string][] = [];
  if (d.pnr) kv.push(["hash", `예약번호 ${d.pnr}`]);
  if (d.room || d.pax) kv.push([b.kind === "hotel" ? "bed-double" : "users", [d.room, d.pax].filter(Boolean).join(" · ")]);
  if (d.model) kv.push(["car", d.model]);
  if (d.options) kv.push(["check", d.options.split(",").join(" · ")]);
  if (b.kind === "car" && d.pickup) kv.push(["map-pin", `픽업 ${d.pickup}${d.dropoff ? ` → 반납 ${d.dropoff}` : ""}`]);
  if (d.address) kv.push(["map-pin", d.address]);
  if (d.open_at) kv.push(["calendar-clock", `예약 오픈 ${d.open_at}${d.open_rule ? ` (${d.open_rule})` : ""}`]);
  if (d.wait) kv.push(["users", d.wait]);
  if (d.cancel) kv.push(["calendar-clock", `무료 취소 ${d.cancel}`]);
  if (d.site) kv.push(["link", `예약한 곳 ${d.site}`]);
  if (b.memo) kv.push(["pencil", b.memo]);

  const startD = b.kind === "hotel" ? d.checkin : b.kind === "car" ? d.pickup_date : d.date;
  const startT = b.kind === "hotel" ? d.checkin_time : b.kind === "car" ? d.pickup_time : d.time;
  const endD = b.kind === "hotel" ? d.checkout : b.kind === "car" ? d.dropoff_date : undefined;
  const endT = b.kind === "hotel" ? d.checkout_time : b.kind === "car" ? d.dropoff_time : undefined;
  const nn = nights(startD, endD);

  return (
    <section className="screen on" id="bookHotel">
      <div className="scr full nonav">
        <div className={`hero${b.photos?.[0] ? "" : " noimg k-blue"}`} style={{ height: b.photos?.[0] ? 260 : 200 }}>
          {b.photos?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="im" src={b.photos[0]} alt="" />
          )}
          <div className="hero-ic">
            <Ic n={KIND_IC[b.kind]} />
          </div>
          <div className="grad" />
          <div className="cv-top">
            <Go as="span" className="glass circ" back>
              <Ic n="chevron-left" />
            </Go>
            <Go as="span" className="glass circ" href={edit}>
              <Ic n="pencil" />
            </Go>
          </div>
        </div>
        <div className="sheet">
          <div className="tags">
            <span className="tag blue">
              <Ic n={KIND_IC[b.kind]} /> {kindLabel(b.kind)}
            </span>
            {b.status === "예약 완료" ? <span className="tag green">확정</span> : statusTag(b.status)}
          </div>
          <h3 className="ptitle" style={{ fontSize: 19 }}>
            {b.title}
          </h3>
          {startD && (
            <div className="hc-g big">
              <div>
                <span>{b.kind === "hotel" ? "체크인" : b.kind === "car" ? "픽업" : "날짜"}</span>
                <b>{dshort(startD)}</b>
                {startT && <em>{startT}{b.kind === "hotel" ? "부터" : ""}</em>}
              </div>
              {endD && (
                <>
                  <div className="arr">{nn > 0 ? <i>{nn}박</i> : <Ic n="chevron-right" />}</div>
                  <div>
                    <span>{b.kind === "hotel" ? "체크아웃" : "반납"}</span>
                    <b>{dshort(endD)}</b>
                    {endT && <em>{endT}{b.kind === "hotel" ? "까지" : ""}</em>}
                  </div>
                </>
              )}
            </div>
          )}
          {kv.map(([ic, t], i) => (
            <div key={i} className="kv" style={{ whiteSpace: "pre-line" }}>
              <span>
                <Ic n={ic} />
              </span>
              {t}
            </div>
          ))}
          {Money}
          {b.photos?.length > 0 && (
            <div className="boxc" style={{ padding: 0, overflow: "hidden" }}>
              <Captures b={b} label="바우처 · 캡처 넣기" />
            </div>
          )}
          <div className="btns3">
            {d.phone ? (
              <a href={`tel:${d.phone}`}>
                <div>
                  <Ic n="phone" />
                  <span>전화</span>
                </div>
              </a>
            ) : b.link && /^https?:\/\//.test(b.link) ? (
              <a href={b.link} target="_blank" rel="noreferrer">
                <div>
                  <Ic n="arrow-up-right" />
                  <span>예약 페이지</span>
                </div>
              </a>
            ) : (
              <Go href={edit}>
                <Ic n="phone" />
                <span>전화 적기</span>
              </Go>
            )}
            {d.address || d.pickup ? (
              <CopyBtn text={d.address || d.pickup} />
            ) : (
              <Go href={edit}>
                <Ic n="map-pin" />
                <span>주소 적기</span>
              </Go>
            )}
            <Go href={`/trips/${id}/money/new?title=${encodeURIComponent(b.title)}`}>
              <Ic n="receipt" />
              <span>결제 기록</span>
            </Go>
          </div>
          {!b.photos?.length && (
            <div className="boxc" style={{ padding: 0, overflow: "hidden" }}>
              <Captures b={b} label="바우처 · 캡처 넣기" />
            </div>
          )}
          {Btns}
          <DelBooking b={b} />
        </div>
      </div>
    </section>
  );
}
