import { loadTrip } from "@/lib/trip";
import { dday, days, md, range, today } from "@/lib/format";
import { catColor } from "@/lib/places";
import { coverDate, cv } from "@/lib/cover";
import { money, pocketUse, sym } from "@/lib/money";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import { CvFlags, Names } from "@/components/TripFlags";
import { BookingRow, Ticket } from "@/components/BookingCards";
import type { Booking, EventRow, Expense, Pocket } from "@/lib/types";

export default async function TripHome({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, trip, members } = await loadTrip(id);
  const [ev, bk, wi, pk, po, ex, en] = await Promise.all([
    supabase.from("events").select("*").eq("trip_id", id).order("sort"),
    supabase.from("bookings").select("*").eq("trip_id", id).order("sort_key", { nullsFirst: false }),
    supabase.from("wishes").select("id", { count: "exact", head: true }).eq("trip_id", id).eq("kind", "place"),
    supabase.from("pack_items").select("done").eq("trip_id", id),
    supabase.from("pockets").select("*").eq("trip_id", id),
    supabase.from("expenses").select("*").eq("trip_id", id),
    supabase.from("entries").select("id", { count: "exact", head: true }).eq("trip_id", id),
  ]);
  const events = (ev.data ?? []) as EventRow[];
  const bookings = (bk.data ?? []) as Booking[];
  const pockets = (po.data ?? []) as Pocket[];
  const expenses = (ex.data ?? []) as Expense[];
  const packs = pk.data ?? [];
  const ds = days(trip.start_date, trip.end_date);
  const now = today();
  const showDay = ds.includes(now) ? now : ds[0];
  const dayNo = showDay ? ds.indexOf(showDay) + 1 : 0;
  const preview = events.filter((e) => e.day === showDay).slice(0, 4);
  const flight = bookings.filter((b) => b.kind === "flight").find((b) => !b.details?.date || b.details.date >= now) ?? bookings.find((b) => b.kind === "flight");
  const hotel = bookings.find((b) => b.kind === "hotel");
  const waits = bookings.filter((b) => b.status === "예약 오픈 대기");
  const leg = flight?.details?.date ? (flight.details.date === trip.start_date ? "가는 편" : flight.details.date === trip.end_date ? "오는 편" : "") : "";
  const packPct = packs.length ? Math.round((packs.filter((p) => p.done).length / packs.length) * 100) : 0;
  const main = pockets.filter((p) => p.currency === trip.currency);
  const left = main.reduce((s, p) => s + pocketUse(p, expenses).left, 0);
  const names = members.map((m) => ({ nickname: m.profiles?.nickname || "?", color: m.profiles?.color || "#8B95A1" }));

  return (
    <section className="screen on" id="home">
      <div className="scr full">
        <div className="cover colorcv" style={cv(trip)}>
          {trip.cover_photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="im" src={trip.cover_photo} alt="" />
          )}
          <div className="cv-top">
            <Go as="span" className="glass circ" href="/">
              <Ic n="menu" />
            </Go>
            <span style={{ display: "flex", gap: 8 }}>
              <Go as="span" className="glass circ" href={`/trips/${id}/edit`}>
                <Ic n="palette" />
              </Go>
              <Go as="span" className="glass circ" href={`/trips/${id}/invite`}>
                <Ic n="share" />
              </Go>
            </span>
          </div>
          <div className="cc" style={{ paddingBottom: 30 }}>
            <div className="cc-e">
              <Ic n="plane" />
            </div>
            <div className="disp cc-t">{trip.title}</div>
            <div className="cc-d">{coverDate(trip.start_date, trip.end_date)}</div>
            <CvFlags trip={trip} />
          </div>
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          <div className="infocard">
            <div className="row">
              <div>
                <div className="ic-t">{trip.title}</div>
                <div className="sub">{range(trip.start_date, trip.end_date)}</div>
              </div>
              {trip.start_date && <span className="dday">{dday(trip.start_date, trip.end_date)}</span>}
            </div>
            <Go className="row" style={{ marginTop: 12 }} href={`/trips/${id}/invite`}>
              <Names list={names} add />
              <span className="sub">
                초대하기 <Ic n="chevron-right" />
              </span>
            </Go>
            <div className="mini3">
              <Go href={`/trips/${id}/plan`}>
                <Ic n="calendar-days" />
                <b>{events.length}개</b>
                <span>일정</span>
              </Go>
              <Go href={`/trips/${id}/bookings`}>
                <Ic n="ticket" />
                <b>{bookings.length}개</b>
                <span>예약</span>
              </Go>
              <Go href={`/trips/${id}/wish`}>
                <Ic n="heart" />
                <b>{wi.count ?? 0}곳</b>
                <span>가고싶은곳</span>
              </Go>
            </div>
          </div>

          <div className="sech">
            <b>예약 내역</b>
            <Go as="span" href={`/trips/${id}/bookings`}>
              {bookings.length ? `전체 ${bookings.length}` : "추가"} <Ic n="chevron-right" />
            </Go>
          </div>
          {flight && <Ticket b={flight} tid={id} leg={leg} />}
          {hotel && <BookingRow b={hotel} tid={id} />}
          {waits.map((b) => (
            <Go key={b.id} className="alert" href={`/trips/${id}/bookings/${b.id}`}>
              <span className="al-ic">
                <Ic n="calendar-clock" />
              </span>
              <div className="mid">
                <b>{b.title} 예약 오픈</b>
                <div className="s">{b.details?.open_at || "여는 날을 적어 두세요"}</div>
              </div>
              <Ic n="chevron-right" />
            </Go>
          ))}
          {!flight && !hotel && waits.length === 0 && (
            <Go className="addline" href={`/trips/${id}/bookings/new`}>
              <Ic n="plus" /> 항공권 · 숙소 예약 넣기
            </Go>
          )}

          <div className="sech">
            <b>{dayNo ? `DAY ${dayNo} 미리보기` : "일정 미리보기"}</b>
            <Go as="span" href={`/trips/${id}/plan${showDay ? `?day=${showDay}` : ""}`}>
              일정 <Ic n="chevron-right" />
            </Go>
          </div>
          {preview.length ? (
            <Go className="dprev" href={`/trips/${id}/plan${showDay ? `?day=${showDay}` : ""}`}>
              {preview.map((e) => (
                <div key={e.id}>
                  <span className="t">{e.time_text || "·"}</span>
                  <span className="d" style={{ background: catColor(e.category) }} />
                  <b>{e.title}</b>
                </div>
              ))}
            </Go>
          ) : (
            <Go className="addline" href={`/trips/${id}/plan/new${showDay ? `?day=${showDay}` : ""}`}>
              <Ic n="plus" /> {showDay ? `${md(showDay)} 일정 추가` : "일정 추가"}
            </Go>
          )}

          <div className="sech">
            <b>한눈에 보기</b>
          </div>
          <div className="tiles">
            <Go href={`/trips/${id}/pack`}>
              <div className="ring" style={{ "--p": packPct } as React.CSSProperties}>
                {packPct}%
              </div>
              <b>준비물</b>
              <span>{packs.length ? `${packs.filter((p) => p.done).length} / ${packs.length} 챙김` : "아직 없어요"}</span>
            </Go>
            <Go href={`/trips/${id}/money`}>
              <div className="tl-ic amber">
                <Ic n="wallet" />
              </div>
              <b>{main.length ? money(left, sym(trip.currency)) : `${expenses.length}건`}</b>
              <span>{main.length ? "남은 예산" : "쓴 돈"}</span>
            </Go>
            <Go href={`/trips/${id}/diary`}>
              <div className="tl-ic violet">
                <Ic n="notebook-pen" />
              </div>
              <b>{en.count ?? 0}개</b>
              <span>여행 기록</span>
            </Go>
          </div>
        </div>
      </div>
    </section>
  );
}
