import { loadTrip } from "@/lib/trip";
import { byEv, days, normTime, parseDate, parseTime, range, today, weekday } from "@/lib/format";
import { evCat, MOVE_IC, MOVE_LABEL } from "@/lib/cats";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import LiveRefresh from "@/components/LiveRefresh";
import type { Booking, EventRow } from "@/lib/types";
import { syncFlight } from "@/lib/flightsync";

const WK_LONG = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

export default async function PlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string }> }) {
  const { id } = await params;
  const { day } = await searchParams;
  const { supabase, trip } = await loadTrip(id);
  const ds = days(trip.start_date, trip.end_date);
  const now = today();
  const sel = day && (ds.includes(day) || day === "none") ? day : ds.includes(now) ? now : ds[0] ?? "none";

  // 예전에 만든 항공권 도착 일정에 '비행' 표시가 없으면 채워 둬요
  const { data: flights } = await supabase.from("bookings").select("*").eq("trip_id", id).eq("kind", "flight");
  for (const f of (flights ?? []) as Booking[]) await syncFlight(supabase, f, ds, true);
  const { data } = await supabase.from("events").select("*").eq("trip_id", id).order("sort");
  const all = (data ?? []) as EventRow[];
  const list = all.filter((e) => (sel === "none" ? !e.day : e.day === sel)).sort(byEv);
  const undated = all.filter((e) => !e.day);
  const no = ds.indexOf(sel) + 1;
  const d = sel !== "none" ? parseDate(sel) : null;
  const base = `/trips/${id}/plan`;

  return (
    <section className="screen on" id="plan">
      <LiveRefresh tripId={id} table="events" />
      <div className="scr">
        <div className="hd">
          <Go style={{ flex: 1 }} href="/">
            <h2>
              {trip.title} <Ic n="chevron-down" />
            </h2>
            <div className="sub">{range(trip.start_date, trip.end_date)}</div>
          </Go>
          <Go as="span" className="ib" href={`${base}/new?day=${sel}`}>
            <Ic n="plus" />
          </Go>
        </div>
        <div className="daychips">
          {ds.map((x, i) => (
            <Go key={x} className={x === sel ? "on" : ""} href={`${base}?day=${x}`} replace>
              <span>DAY {i + 1}</span>
              <b>{parseDate(x).getDate()}</b>
              <i>{weekday(x)}</i>
            </Go>
          ))}
          {undated.length > 0 && (
            <Go className={sel === "none" ? "on" : ""} href={`${base}?day=none`} replace>
              <i>날짜 미정 {undated.length}</i>
            </Go>
          )}
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          <div className="dayblk on">
            <div className="dayhead">
              <b>{d ? `DAY ${no} · ${d.getMonth() + 1}월 ${d.getDate()}일 ${WK_LONG[d.getDay()]}` : "날짜 미정"}</b>
              <span className="sub">{list.length}개 일정</span>
            </div>
            {list.length > 0 ? (
              <div className="tl">
                {list.map((e, i) => {
                  const c = evCat(e.category);
                  const soft = parseTime(e.time_text) == null;
                  return (
                    <div key={e.id} style={{ display: "contents" }}>
                      {i > 0 &&
                        (e.move_mode ? (
                          <Go className="gap" href={`${base}/${e.id}/move`}>
                            <span className={`mv ${e.move_mode}`}>
                              <Ic n={MOVE_IC[e.move_mode] ?? "footprints"} /> {MOVE_LABEL[e.move_mode]}
                              {e.move_note ? (/^\d/.test(e.move_note) ? " " : " · ") + e.move_note : ""} <Ic n="chevron-right" />
                            </span>
                          </Go>
                        ) : (
                          <Go className="gap" href={`${base}/${e.id}/move`}>
                            <span className="mv none">
                              <Ic n="plus" /> 이동 방법 선택
                            </span>
                          </Go>
                        ))}
                      <Go className={`ev${e.booking_id ? "" : ""}`} href={`${base}/${e.id}`}>
                        <div className={`tm${soft ? " soft" : ""}${!e.time_text ? " none" : ""}`}>{normTime(e.time_text) || "·"}</div>
                        <div className={`rail${i === list.length - 1 ? " last" : ""}`}>
                          <i className={`dot ${c.dot}`} />
                        </div>
                        <div className="evc">
                          {e.photo ? (
                            <div className="evp">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img className="im" src={e.photo} alt="" />
                            </div>
                          ) : (
                            <div className={`evi ${c.evi}`}>
                              <Ic n={c.ic} />
                            </div>
                          )}
                          <div className="mid">
                            <b>{e.title}</b>
                            {e.address && (
                              <div className="s">
                                <Ic n="map-pin" /> {e.address}
                              </div>
                            )}
                            {e.memo && <div className="memo note">{e.memo}</div>}
                            <span className={`tag ${c.tag}`}>
                              {e.booking_id && <Ic n="ticket" />} {e.category}
                              {e.booking_id ? " · 예약" : ""}
                            </span>
                          </div>
                        </div>
                      </Go>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="tl" style={{ padding: "26px 16px", textAlign: "center", color: "var(--sub)", fontSize: 14 }}>
                아직 일정이 없어요
              </div>
            )}
            {sel !== "none" && undated.length > 0 && (
              <div className="unsched">
                <div className="us-h">
                  <Ic n="sparkles" /> 날짜 미정 <span>{undated.length}</span>
                </div>
                {undated.slice(0, 3).map((e) => {
                  const c = evCat(e.category);
                  return (
                    <div key={e.id} className="us-i">
                      <span className={`evi ${c.evi} sm`}>
                        <Ic n={c.ic} />
                      </span>
                      <div className="mid">
                        <b>{e.title}</b>
                        <div className="s">{e.memo || e.address || e.category}</div>
                      </div>
                      <Go as="span" className="us-b" href={`${base}/${e.id}?day=${sel}`}>
                        이날 넣기
                      </Go>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <Go className="addline" href={`${base}/new?day=${sel}`}>
            <Ic n="plus" /> 일정 추가
          </Go>
        </div>
      </div>
    </section>
  );
}
