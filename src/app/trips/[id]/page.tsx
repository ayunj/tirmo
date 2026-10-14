import { loadTrip } from "@/lib/trip";
import { byEv, dday, days, md, normTime, nowTime, parseDate, parseTime, today } from "@/lib/format";
import { CURRENCIES } from "@/lib/places";
import { evEmoji, MOVE_EMOJI } from "@/lib/cats";
import { splitMove } from "@/lib/move";
import FxCalc from "@/components/FxCalc";
import { coverDate, cv } from "@/lib/cover";
import { money, pocketUse, sym, visibleMoney } from "@/lib/money";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import { CvFlags } from "@/components/TripFlags";
import { Ticket } from "@/components/BookingCards";
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
  const dd = dday(trip.start_date, trip.end_date);
  const status = dd === "여행 중" || dd === "D-DAY" ? `✈️ 여행 ${dayNo || 1}일째` : dd === "다녀옴" ? "🧳 다녀왔어요" : dd ? `✈️ ${dd}` : "✈️ 여행 준비";
  const together = ["", "혼자", "둘이서", "셋이서", "넷이서", "다섯이서"][members.length] ?? `${members.length}명`;
  const flagEmoji = trip.kind === "domestic" ? "" : (trip.countries ?? []).slice(0, 3).map((c) => c.toUpperCase().replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))).join("");
  const nd = (x: string) => `${+x.split("-")[1]}월 ${+x.split("-")[2]}일`;
  const tripNights = trip.start_date && trip.end_date ? Math.round((parseDate(trip.end_date).getTime() - parseDate(trip.start_date).getTime()) / 864e5) : 0;
  const dateLine = trip.start_date ? `${nd(trip.start_date)}${trip.end_date && trip.end_date !== trip.start_date ? ` – ${trip.end_date.slice(5, 7) === trip.start_date.slice(5, 7) ? `${+trip.end_date.split("-")[2]}일` : nd(trip.end_date)}` : ""}${tripNights > 0 ? `, ${tripNights}박 ${tripNights + 1}일` : ""}` : "날짜 미정";
  const hotel = bookings.find((b) => b.kind === "hotel");
  const nightsN = hotel?.details?.checkin && hotel.details?.checkout ? Math.round((parseDate(hotel.details.checkout).getTime() - parseDate(hotel.details.checkin).getTime()) / 864e5) : 0;
  const waits = bookings.filter((b) => b.status === "예약 오픈 대기");
  const main = pockets.filter((p) => p.currency === trip.currency);
  const left = main.reduce((s, p) => s + pocketUse(p, expenses).left, 0);

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
          <div className="hm3-chips">
            <span className="hm3-st">{status}</span>
            <Go as="span" className="hm3-mem" href={`/trips/${id}/invite`}>
              👭 {together}
            </Go>
          </div>
          <h1 className="hm3-t">{trip.title}</h1>
          <div className="hm3-d">
            {flagEmoji && <span aria-hidden="true">{flagEmoji} </span>}
            {dateLine}
          </div>

          {flights.map((f) => (
            <Ticket key={f.id} b={f} tid={id} leg={legOf(f)} />
          ))}
          {hotel && (
            <Go className="hm3-hotel" href={`/trips/${id}/bookings/${hotel.id}`}>
              <span aria-hidden="true">🏨</span>
              <div className="mid">
                <b>{hotel.title || hotel.details?.name || "숙소"}</b>
                <div className="s">
                  {[hotel.details?.checkin ? `체크인 ${+hotel.details.checkin.split("-")[1]}/${+hotel.details.checkin.split("-")[2]}${hotel.details?.checkin_time ? ` ${hotel.details.checkin_time}` : ""}` : "", nightsN > 0 ? `${nightsN}박` : ""].filter(Boolean).join(", ")}
                </div>
              </div>
            </Go>
          )}
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
            <b>⏰ {nowIdx >= 0 ? "지금 일정" : dayNo ? `DAY ${dayNo} 일정` : "일정"}</b>
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
                    <span className={`nc3-t tnum${t ? "" : " none"}`}>{t || "–"}</span>
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
                <b>💴 환전 계산</b>
                <span className="sub" style={{ fontSize: 13 }}>
                  {cur.sym.trim()}
                  {trip.rate_unit.toLocaleString()} = ₩{Number(trip.rate).toLocaleString()}
                </span>
              </div>
              <FxCalc sym={cur.sym.trim()} rate={Number(trip.rate)} unit={Number(trip.rate_unit) || 1} />
            </>
          )}

          <div className="sech">
            <b>👀 한눈에 보기</b>
          </div>
          <div className="gl3">
            <Go href={`/trips/${id}/pack`}>
              <span aria-hidden="true">🧳</span>
              <b className="tnum">{packs.length ? `${packs.filter((p) => p.done).length} / ${packs.length}` : "0"}</b>
              <i>준비물</i>
            </Go>
            <Go href={`/trips/${id}/money`}>
              <span aria-hidden="true">💰</span>
              <b className="tnum">{main.length ? money(left, sym(trip.currency)) : `${expenses.length}건`}</b>
              <i>{main.length ? "남은 예산" : "총 지출"}</i>
            </Go>
            <Go href={`/trips/${id}/wish?tab=shop`}>
              <span aria-hidden="true">🛍️</span>
              <b className="tnum">
                {shopGot} / {shopAll.length}
              </b>
              <i>쇼핑</i>
            </Go>
            <Go href={`/trips/${id}/bookings`}>
              <span aria-hidden="true">🎫</span>
              <b className="tnum">{bookings.length}건</b>
              <i>예약</i>
            </Go>
            <Go href={`/trips/${id}/wish`}>
              <span aria-hidden="true">💗</span>
              <b className="tnum">{placeN}곳</b>
              <i>가고싶은곳</i>
            </Go>
            <Go href={`/trips/${id}/diary`}>
              <span aria-hidden="true">📝</span>
              <b className="tnum">{en.count ?? 0}개</b>
              <i>여행 기록</i>
            </Go>
          </div>
        </div>
      </div>
    </section>
  );
}
