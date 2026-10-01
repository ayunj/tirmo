import Go from "@/components/Go";
import { normTime } from "@/lib/format";
import Ic from "@/components/Ic";
import { airportCode, between, nights, when } from "@/lib/booking";
import { parseDate, weekday } from "@/lib/format";
import type { Booking } from "@/lib/types";

/** 항공권 카드 (목업 .ticket) */
export function Ticket({ b, tid, leg }: { b: Booking; tid: string; leg?: string }) {
  const d = b.details || {};
  const date = d.date ? parseDate(d.date) : null;
  return (
    <Go className="ticket" href={`/trips/${tid}/bookings/${b.id}`}>
      <div className="tk-l">
        <div className="tk-air">{[d.airline, d.flight_no, leg].filter(Boolean).join(" · ") || "항공권"}</div>
        <div className="tk-rt">
          <div>
            <b>{airportCode(d.from) || "출발"}</b>
            <span>{normTime(d.from_time)}</span>
          </div>
          <div className="tk-mid">
            <Ic n="plane" />
            <i>{between(d.from_time, d.to_time)}</i>
          </div>
          <div style={{ textAlign: "right" }}>
            <b>{airportCode(d.to) || "도착"}</b>
            <span>{normTime(d.to_time)}</span>
          </div>
        </div>
      </div>
      <div className="tk-r">
        {date ? (
          <>
            <span>{date.getMonth() + 1}월</span>
            <b>{date.getDate()}</b>
            <span>{weekday(d.date)}요일</span>
          </>
        ) : (
          <span>날짜 미정</span>
        )}
      </div>
    </Go>
  );
}

export function statusTag(s: string | null) {
  if (!s) return null;
  return s === "예약 완료" ? <span className="tag blue">확정</span> : <span className="tag amber">{s}</span>;
}

/** 숙소 · 기타 예약 한 줄 (목업 .bkrow) */
export function BookingRow({ b, tid }: { b: Booking; tid: string }) {
  const d = b.details || {};
  const w = when(b);
  const n = nights(d.checkin, d.checkout);
  const ic = ({ hotel: "bed-double", car: "car", restaurant: "utensils", tour: "ticket", etc: "ellipsis", flight: "plane" } as const)[b.kind];
  const sub =
    b.kind === "hotel"
      ? `체크인 ${d.checkin ? `${+d.checkin.split("-")[1]}/${+d.checkin.split("-")[2]}` : "-"}${d.checkin_time ? ` ${d.checkin_time}` : ""}${n > 0 ? ` · ${n}박` : ""}`
      : w.date
        ? `${+w.date.split("-")[1]}/${+w.date.split("-")[2]} (${"일월화수목금토"[new Date(w.date).getDay()]})${w.time ? ` ${w.time}` : ""}`
        : "날짜 미정";
  return (
    <Go className="bkrow" href={`/trips/${tid}/bookings/${b.id}`}>
      <div className="th ctile" style={{ "--c1": "#EAF4FF", "--c2": "#D6E9FF", color: "#2B7FE0", fontSize: 22 } as React.CSSProperties}>
        {b.photos?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="im" src={b.photos[0]} alt="" />
        ) : (
          <Ic n={ic} />
        )}
      </div>
      <div className="mid">
        <b>{b.title}</b>
        <div className="s">
          {b.kind === "hotel" && <Ic n={ic} />} {sub}
          {d.pax ? ` · ${d.pax}` : ""}
        </div>
        {b.status === "예약 오픈 대기" && d.open_at && (
          <span className="tag amber">
            <Ic n="calendar-clock" /> {d.open_at} 예약 오픈
          </span>
        )}
      </div>
      {b.kind === "restaurant" && b.status === "예약 오픈 대기" ? <span className="tag">대기</span> : statusTag(b.status)}
    </Go>
  );
}
