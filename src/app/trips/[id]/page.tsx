import { loadTrip } from "@/lib/trip";
import { byEv, dday, days, md, normTime, nowTime, parseTime, range, today } from "@/lib/format";
import { CURRENCIES } from "@/lib/places";
import { evEmoji, MOVE_EMOJI } from "@/lib/cats";
import { splitMove } from "@/lib/move";
import FxCalc from "@/components/FxCalc";
import { coverDate, cv } from "@/lib/cover";
import { money, pocketUse, sym, visibleMoney } from "@/lib/money";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import { CvFlags, Names } from "@/components/TripFlags";
import { BookingRow, Ticket } from "@/components/BookingCards";
import type { Booking, EventRow, Expense, Pocket } from "@/lib/types";

export default async function TripHome({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, trip, members, user } = await loadTrip(id);
  const [ev, bk, wi, pk, po, ex, en] = await Promise.all([
    supabase.from("events").select("*").eq("trip_id", id).order("sort"),
    supabase.from("bookings").select("*").eq("trip_id", id).order("sort_key", { nullsFirst: false }),
    supabase.from("wishes").select("*").eq("trip_id", id),
    supabase.from("pack_items").select("done").eq("trip_id", id).or(`assignee.eq.${user.id},assignee.is.null`),
    supabase.from("pockets").select("*").eq("trip_id", id),
    supabase.from("expenses").select("*").eq("trip_id", id),
    supabase.from("entries").select("id", { count: "exact", head: true }).eq("trip_id", id).eq("created_by", user.id),
  ]);
  const events = (ev.data ?? []) as EventRow[];
  const bookings = (bk.data ?? []) as Booking[];
  const { pockets, expenses } = visibleMoney((po.data ?? []) as Pocket[], (ex.data ?? []) as Expense[], user.id);
  const packs = pk.data ?? [];
  const ds = days(trip.start_date, trip.end_date);
  const now = today();
  const showDay = ds.includes(now) ? now : ds[0];
  const dayNo = showDay ? ds.indexOf(showDay) + 1 : 0;
  // 지금 일정: 지난 1개(흐리게) · 지금 · 다음 3개
  const dayList = events.filter((e) => e.day === showDay).sort(byEv);
  const nowMin = parseTime(nowTime()) ?? 0;
  let nowIdx = -1;
  if (showDay === now) dayList.forEach((e, i) => { const t = parseTime(e.time_text); if (t != null && t <= nowMin) nowIdx = i; });
  const from = Math.max(0, nowIdx - 1);
  const preview = dayList.slice(from, nowIdx >= 0 ? nowIdx + 4 : 4).map((e) => ({ e, i: dayList.indexOf(e) }));
  const flights = bookings.filter((b) => b.kind === "flight").sort((a, b) => (a.details?.date ?? "").localeCompare(b.details?.date ?? "") || (a.details?.from_time ?? "").localeCompare(b.details?.from_time ?? ""));
  const legOf = (b: Booking) => (b.details?.date ? (b.details.date === trip.start_date ? "가는 편" : b.details.date === trip.end_date ? "오는 편" : "") : "");
  const wishVis = (wi.data ?? []).filter((w) => w.created_by === user.id || w.shared !== false);
  const shopAll = wishVis.filter((w) => w.kind === "shop" && w.status !== "no");
  const shopGot = shopAll.filter((w) => w.status === "buy" || w.status === "done").length;
  const placeN = wishVis.filter((w) => w.kind !== "shop").length;
  const cur = CURRENCIES[trip.currency];
  const hotel = bookings.find((b) => b.kind === "hotel");
  const waits = bookings.filter((b) => b.status === "예약 오픈 대기");
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
            <div className="cc-d cc-row">
              <span>{coverDate(trip.start_date, trip.end_date)}</span>
              <CvFlags trip={trip} />
            </div>
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
          </div>

          <div className="sech">
            <b>예약 내역</b>
            <Go as="span" href={`/trips/${id}/bookings`}>
              {bookings.length ? `전체 ${bookings.length}` : "추가"} <Ic n="chevron-right" />
            </Go>
          </div>
          {flights.map((f) => (
            <Ticket key={f.id} b={f} tid={id} leg={legOf(f)} />
          ))}
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
          {!flights.length && !hotel && waits.length === 0 && (
            <Go className="addline" href={`/trips/${id}/bookings/new`}>
              <Ic n="plus" /> 항공권 · 숙소 예약 넣기
            </Go>
          )}

          <div className="sech">
            <b>{nowIdx >= 0 ? "지금 일정" : dayNo ? `DAY ${dayNo} 일정` : "일정"}</b>
            <Go as="span" href={`/trips/${id}/plan${showDay ? `?day=${showDay}` : ""}`}>
              전체 일정 <Ic n="chevron-right" />
            </Go>
          </div>
          {preview.length ? (
            <div className="nc3-list">
              {preview.map(({ e, i }) => {
                const nx = dayList[i + 1];
                const mv = nx?.move_mode ? `${MOVE_EMOJI[nx.move_mode] ?? ""} ${splitMove(nx.move_note).dur}`.trim() : "";
                const t = normTime(e.time_text);
                return (
                  <Go key={e.id} className={`nc3${i === nowIdx ? " now" : i < nowIdx ? " past" : ""}`} href={`/trips/${id}/plan/${e.id}`}>
                    <span className={`nc3-t num${t ? "" : " none"}`}>{t || "–"}</span>
                    <span className="nc3-e" aria-hidden="true">
                      {evEmoji(e)}
                    </span>
                    <div className="mid">
                      <div className="nc3-k">
                        {e.category}
                        {i === nowIdx ? " · 지금" : ""}
                      </div>
                      <b>{e.title}</b>
                    </div>
                    {i >= nowIdx && mv && <small>{mv}</small>}
                  </Go>
                );
              })}
            </div>
          ) : (
            <Go className="addline" href={`/trips/${id}/plan/new${showDay ? `?day=${showDay}` : ""}`}>
              <Ic n="plus" /> {showDay ? `${md(showDay)} 일정 추가` : "일정 추가"}
            </Go>
          )}

          {trip.currency !== "KRW" && cur && Number(trip.rate) > 0 && (
            <>
              <div className="sech">
                <b>환전 계산</b>
                <span className="sub" style={{ fontSize: 13 }}>
                  {cur.sym.trim()}
                  {trip.rate_unit.toLocaleString()} = ₩{Number(trip.rate).toLocaleString()}
                </span>
              </div>
              <FxCalc sym={cur.sym.trim()} rate={Number(trip.rate)} unit={Number(trip.rate_unit) || 1} />
            </>
          )}

          <div className="sech">
            <b>한눈에 보기</b>
          </div>
          <div className="gl3">
            <Go href={`/trips/${id}/pack`}>
              <span aria-hidden="true">🧳</span>
              <b className="num">{packs.length ? `${packs.filter((p) => p.done).length} / ${packs.length}` : "0"}</b>
              <i>준비물</i>
            </Go>
            <Go href={`/trips/${id}/money`}>
              <span aria-hidden="true">💰</span>
              <b className="num">{main.length ? money(left, sym(trip.currency)) : `${expenses.length}건`}</b>
              <i>{main.length ? "남은 예산" : "총 지출"}</i>
            </Go>
            <Go href={`/trips/${id}/wish?tab=shop`}>
              <span aria-hidden="true">🛍️</span>
              <b className="num">
                {shopGot} / {shopAll.length}
              </b>
              <i>쇼핑</i>
            </Go>
            <Go href={`/trips/${id}/bookings`}>
              <span aria-hidden="true">🎫</span>
              <b className="num">{bookings.length}건</b>
              <i>예약</i>
            </Go>
            <Go href={`/trips/${id}/wish`}>
              <span aria-hidden="true">💗</span>
              <b className="num">{placeN}곳</b>
              <i>가고싶은곳</i>
            </Go>
            <Go href={`/trips/${id}/diary`}>
              <span aria-hidden="true">📝</span>
              <b className="num">{en.count ?? 0}개</b>
              <i>여행 기록</i>
            </Go>
          </div>
        </div>
      </div>
    </section>
  );
}
