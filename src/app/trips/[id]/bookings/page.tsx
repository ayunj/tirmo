import { loadTrip } from "@/lib/trip";
import { BOOKING_KINDS, nights } from "@/lib/booking";
import { parseDate } from "@/lib/format";
import { money, sym } from "@/lib/money";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import LiveRefresh from "@/components/LiveRefresh";
import { BookingRow, Ticket, statusTag } from "@/components/BookingCards";
import type { Booking } from "@/lib/types";

const WK = ["일", "월", "화", "수", "목", "금", "토"];
const dw = (s?: string, t?: string) => {
  if (!s) return "-";
  const x = parseDate(s);
  return `${x.getMonth() + 1}/${x.getDate()} ${WK[x.getDay()]}${t ? ` ${t}` : ""}`;
};

function HotelCard({ b, tid }: { b: Booking; tid: string }) {
  const d = b.details || {};
  const n = nights(d.checkin, d.checkout);
  return (
    <Go className="hotelc" href={`/trips/${tid}/bookings/${b.id}`}>
      <div className="hc-p ctile" style={{ "--c1": "#EAF4FF", "--c2": "#D6E9FF", color: "#2B7FE0", fontSize: 34 } as React.CSSProperties}>
        {b.photos?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="im" src={b.photos[0]} alt="" />
        ) : (
          <Ic n="bed-double" />
        )}
        <span style={{ position: "absolute", left: 10, top: 10 }}>{statusTag(b.status)}</span>
      </div>
      <div className="hc-b">
        <b>{b.title}</b>
        <div className="hc-g">
          <div>
            <span>체크인</span>
            <b>{dw(d.checkin, d.checkin_time)}</b>
          </div>
          <div className="arr">
            <Ic n="chevron-right" />
          </div>
          <div>
            <span>체크아웃</span>
            <b>{dw(d.checkout, d.checkout_time)}</b>
          </div>
        </div>
        <div className="row s">
          <span>{[d.room, n > 0 ? `${n}박` : ""].filter(Boolean).join(" · ")}</span>
          {b.amount != null && (
            <b>
              {money(Number(b.amount), sym(b.currency || "KRW"))} {d.pay === "현장결제" ? "현장결제" : ""}
            </b>
          )}
        </div>
      </div>
    </Go>
  );
}

export default async function BookingsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string }> }) {
  const { id } = await params;
  const { k = "all" } = await searchParams;
  const { supabase, trip } = await loadTrip(id);
  const { data } = await supabase.from("bookings").select("*").eq("trip_id", id).order("sort_key", { nullsFirst: false }).order("created_at");
  const all = (data ?? []) as Booking[];
  const count = (key: string) => all.filter((b) => b.kind === key).length;
  const groups = BOOKING_KINDS.filter((g) => (k === "all" ? count(g.key) > 0 : g.key === k));
  const flights = all.filter((b) => b.kind === "flight");
  const leg = (b: Booking) => (b.details?.date === trip.start_date ? "가는 편" : b.details?.date === trip.end_date ? "오는 편" : "");

  return (
    <section className="screen on" id="book">
      <LiveRefresh tripId={id} table="bookings" />
      <div className="scr">
        <div className="hd">
          <Go as="span" className="ib" href={`/trips/${id}/more`}>
            <Ic n="chevron-left" />
          </Go>
          <h2>예약</h2>
          <Go as="span" className="ib dark" href={`/trips/${id}/bookings/new${k !== "all" ? `?kind=${k}` : ""}`}>
            <Ic n="plus" />
          </Go>
        </div>
        <div className="chips utabs">
          <Go as="span" className={`chip${k === "all" ? " on" : ""}`} href="?k=all" replace>
            전체 {all.length}
          </Go>
          {BOOKING_KINDS.map((g) => (
            <Go key={g.key} as="span" className={`chip${k === g.key ? " on" : ""}`} href={`?k=${g.key}`} replace>
              {g.short}
              {count(g.key) ? ` ${count(g.key)}` : ""}
            </Go>
          ))}
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          {groups.map((g) => (
            <div key={g.key} style={{ display: "contents" }}>
              <div className="grp">{g.label}</div>
              {all
                .filter((b) => b.kind === g.key)
                .map((b) => (b.kind === "flight" ? <Ticket key={b.id} b={b} tid={id} leg={flights.length > 1 ? leg(b) : ""} /> : b.kind === "hotel" ? <HotelCard key={b.id} b={b} tid={id} /> : <BookingRow key={b.id} b={b} tid={id} />))}
            </div>
          ))}
          {groups.length === 0 && <div className="sub" style={{ textAlign: "center", padding: "50px 0 20px" }}>아직 예약이 없어요</div>}
          <Go className="addline" href={`/trips/${id}/bookings/new${k !== "all" ? `?kind=${k}` : ""}`}>
            <Ic n="plus" /> 예약 추가
          </Go>
        </div>
      </div>
    </section>
  );
}
