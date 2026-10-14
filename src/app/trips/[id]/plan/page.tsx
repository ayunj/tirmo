import { loadTrip } from "@/lib/trip";
import { byEv, days, normTime, nowTime, parseDate, parseTime, range, today, weekday } from "@/lib/format";
import { evCat, evEmoji, MOVE_EMOJI, MOVE_LABEL } from "@/lib/cats";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import LiveRefresh from "@/components/LiveRefresh";
import type { Booking, EventRow } from "@/lib/types";
import { syncFlight } from "@/lib/flightsync";
import { splitMove } from "@/lib/move";
import { sym } from "@/lib/money";
import { evLinks } from "@/lib/evlinks";

const WK_LONG = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
const mapUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export default async function PlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string }> }) {
  const { id } = await params;
  const { day } = await searchParams;
  const { supabase, trip, user } = await loadTrip(id);
  const ds = days(trip.start_date, trip.end_date);
  const now = today();
  const sel = day && (ds.includes(day) || day === "none" || day === "all") ? day : ds.includes(now) ? now : ds[0] ?? "none";

  // 예전에 만든 항공권 도착 일정에 '비행' 표시가 없으면 채워 둬요
  const { data: flights } = await supabase.from("bookings").select("*").eq("trip_id", id).eq("kind", "flight");
  for (const f of (flights ?? []) as Booking[]) await syncFlight(supabase, f, ds, true);
  const [{ data }, wq] = await Promise.all([
    supabase.from("events").select("*").eq("trip_id", id).order("sort"),
    supabase.from("wishes").select("id, kind, status, shared, created_by").eq("trip_id", id),
  ]);
  const all = (data ?? []) as EventRow[];
  const wishes = new Map((wq.data ?? []).filter((w) => w.created_by === user.id || w.shared !== false).map((w) => [w.id as string, w]));
  const undated = all.filter((e) => !e.day);
  const base = `/trips/${id}/plan`;
  const cur = sym(trip.currency).trim();

  // 지금: 오늘 일정 중 시간을 적은 것 가운데 지금 시각 이전의 마지막 일정
  const nowMin = parseTime(nowTime()) ?? 0;
  const todays = all.filter((e) => e.day === now).sort(byEv);
  const nowId = [...todays].reverse().find((e) => {
    const t = parseTime(e.time_text);
    return t != null && t <= nowMin;
  })?.id;

  const shown = sel === "all" ? ds : [sel];
  const tabs = [{ k: "all", top: "전체", sub: `${ds.length}일` }, ...ds.map((x, i) => ({ k: x, top: `${i + 1}일차`, sub: `${+x.split("-")[1]}/${+x.split("-")[2]} ${weekday(x)}` }))];

  function Day({ dk }: { dk: string }) {
    const list = all.filter((e) => (dk === "none" ? !e.day : e.day === dk)).sort(byEv);
    const d = dk !== "none" ? parseDate(dk) : null;
    const no = ds.indexOf(dk) + 1;
    return (
      <div className="p3-day">
        <div className="p3-dh">
          <b>{d ? `DAY ${no}` : "날짜 미정"}</b>
          {d && <span className="p3-dd">{`${d.getMonth() + 1}월 ${d.getDate()}일 ${WK_LONG[d.getDay()]}`}</span>}
          {dk === now && <span className="p3-today">오늘</span>}
          {list.length > 1 ? (
            <Go as="span" className="p3-ord" href={`${base}/order?day=${dk}`}>
              <Ic n="arrow-up-down" /> 순서
            </Go>
          ) : (
            <span className="p3-cnt">{list.length}개</span>
          )}
        </div>
        {list.length === 0 && (
          <Go className="p3-empty" href={`${base}/new?day=${dk}`}>
            <Ic n="plus" /> 일정 추가
          </Go>
        )}
        {list.map((e, i) => {
          const c = evCat(e.category);
          const isNow = e.id === nowId;
          const L = evLinks(e);
          const ws = L.wis.map((w) => wishes.get(w)).filter(Boolean) as { kind: string; status: string | null }[];
          const shops = ws.filter((w) => w.kind === "shop");
          const places = ws.filter((w) => w.kind !== "shop");
          const bought = shops.filter((w) => w.status === "buy" || w.status === "done").length;
          const memo = (e.memo ?? "").split("\n")[0];
          const t = normTime(e.time_text);
          return (
            <div key={e.id} style={{ display: "contents" }}>
              {i > 0 &&
                (e.move_mode ? (
                  <div className="p3-mv">
                    <span className="p3-t" />
                    <span className="p3-r" />
                    <Go as="span" className="p3-mvp" href={`${base}/${e.id}/move`}>
                      {(() => {
                        const mv = splitMove(e.move_note);
                        const fare = mv.fare ? (mv.won ? `₩${Number(mv.fare).toLocaleString()}` : `${cur}${Number(mv.fare).toLocaleString()}`) : "";
                        return (
                          <>
                            <span aria-hidden="true">{MOVE_EMOJI[e.move_mode] ?? "🚶"}</span> {[`${MOVE_LABEL[e.move_mode] ?? ""}${mv.dur ? ` ${mv.dur}` : ""}`, fare].filter(Boolean).join(" · ")}
                          </>
                        );
                      })()}
                    </Go>
                  </div>
                ) : (
                  <div className="p3-mv">
                    <span className="p3-t" />
                    <span className="p3-r" />
                    <Go as="span" className="p3-mvp none" href={`${base}/${e.id}/move`}>
                      <Ic n="plus" /> 이동 방법
                    </Go>
                  </div>
                ))}
              <div className={`p3-ev${isNow ? " now" : ""}`}>
                <span className={`p3-t${t ? "" : " none"}`}>{t || "–"}</span>
                <span className={`p3-r${i === 0 ? " first" : ""}${i === list.length - 1 ? " last" : ""}`}>
                  <i />
                </span>
                <div className="p3-c">
                  <Go className="p3-main" href={`${base}/${e.id}`}>
                    <span className="p3-em" aria-hidden="true">
                      {evEmoji(e)}
                    </span>
                    <div className="mid">
                      <div className="p3-k">
                        {e.category || c.key}
                        {isNow ? " · 지금" : !t ? " · 시간 미정" : ""}
                      </div>
                      <b>{e.title}</b>
                      {memo && <div className="p3-memo">{memo}</div>}
                      {(L.bks.length > 0 || places.length > 0 || shops.length > 0) && (
                        <div className="p3-chips">
                          {L.bks.length > 0 && <span>예약 {L.bks.length}</span>}
                          {places.length > 0 && <span>가고싶은곳 {places.length}</span>}
                          {shops.length > 0 && (
                            <span>
                              쇼핑 {bought}/{shops.length}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {e.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="p3-ph" src={e.photo} alt="" />
                    )}
                  </Go>
                  {(e.address || e.link) && (
                    <div className="p3-btns">
                      {e.address && (
                        <a className="p3-ib" href={mapUrl(e.address)} target="_blank" rel="noopener" aria-label="지도 열기">
                          <Ic n="map-pin" />
                        </a>
                      )}
                      {e.link && (
                        <a className="p3-ib" href={e.link} target="_blank" rel="noopener" aria-label="링크 열기">
                          <Ic n="arrow-up-right" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className="screen on" id="plan">
      <LiveRefresh tripId={id} table="events" />
      <div className="scr">
        <div className="hd p3-hd">
          <Go style={{ flex: 1 }} href={`/trips/${id}`}>
            <h2>
              {trip.title} <Ic n="chevron-down" />
            </h2>
            <div className="sub">{range(trip.start_date, trip.end_date)}</div>
          </Go>
          <Go as="span" className="ib p3-add" href={`${base}/new?day=${sel === "all" ? ds[0] ?? "none" : sel}`}>
            <Ic n="plus" />
          </Go>
        </div>
        <div className="p3-tabs">
          {tabs.map((x) => (
            <Go key={x.k} className={x.k === sel ? "on" : ""} href={`${base}?day=${x.k}`} replace>
              <b>{x.top}</b>
              <span>{x.sub}</span>
            </Go>
          ))}
          {undated.length > 0 && (
            <Go className={sel === "none" ? "on" : ""} href={`${base}?day=none`} replace>
              <b>미정</b>
              <span>{undated.length}개</span>
            </Go>
          )}
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          {shown.map((dk) => (
            <Day key={dk} dk={dk} />
          ))}
          {sel !== "none" && sel !== "all" && undated.length > 0 && (
            <div className="unsched">
              <div className="us-h">
                <Ic n="sparkles" /> 날짜 미정 <span>{undated.length}</span>
              </div>
              {undated.slice(0, 3).map((e) => (
                <div key={e.id} className="us-i">
                  <span className="p3-em sm" aria-hidden="true">
                    {evEmoji(e)}
                  </span>
                  <div className="mid">
                    <b>{e.title}</b>
                    <div className="s">{e.memo || e.address || e.category}</div>
                  </div>
                  <Go as="span" className="us-b" href={`${base}/${e.id}?day=${sel}`}>
                    이날 넣기
                  </Go>
                </div>
              ))}
            </div>
          )}
          <Go className="addline" href={`${base}/new?day=${sel === "all" ? ds[0] ?? "none" : sel}`}>
            <Ic n="plus" /> 일정 추가
          </Go>
        </div>
      </div>
    </section>
  );
}
