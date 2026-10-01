import { Fragment } from "react";
import { loadMoney } from "@/lib/moneyload";
import { days, mdLong, parseDate, weekday } from "@/lib/format";
import { CURRENCIES } from "@/lib/places";
import { EXP_CATS, expCat, money, pkStyle, pocketUse, settle, sym, toKrw } from "@/lib/money";
import Go from "@/components/Go";
import TripTitle from "@/components/TripTitle";
import Ic, { type IcName } from "@/components/Ic";
import LiveRefresh from "@/components/LiveRefresh";
import type { Expense } from "@/lib/types";

export default async function MoneyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; d?: string }> }) {
  const { id } = await params;
  const { tab = "pocket", d = "all" } = await searchParams;
  const { trip, user, members, pockets, expenses, transfers, topups, people } = await loadMoney(id);
  const ds = days(trip.start_date, trip.end_date);
  const person = (pid: string | null) => people.find((p) => p.id === pid);
  const krw = (e: Expense) => toKrw(Number(e.amount), e.currency, trip);
  const total = expenses.reduce((s, e) => s + krw(e), 0);
  const base = `/trips/${id}/money`;
  const curName = trip.currency === "JPY" ? "엔화" : CURRENCIES[trip.currency]?.name ?? trip.currency;

  return (
    <section className="screen on" id={tab === "list" ? "moneyList" : tab === "stats" ? "moneyStats" : "money"}>
      <LiveRefresh tripId={id} table="expenses" />
      <LiveRefresh tripId={id} table="pockets" />
      <div className="scr">
        <div className="hd">
          <TripTitle id={id} title={trip.title} start={trip.start_date} end={trip.end_date} label="경비" />
          {tab === "stats" && members.length > 1 && (
            <Go as="span" className="ib" href={`${base}/settle`}>
              <Ic n="arrow-left-right" />
            </Go>
          )}
          <Go as="span" className="ib" href={tab === "pocket" ? `${base}/pocket/new` : `${base}/new`}>
            <Ic n="plus" />
          </Go>
        </div>
        <div className="seg3">
          <Go className={tab === "pocket" ? "on" : ""} href={base} replace>
            포켓
          </Go>
          <Go className={tab === "list" ? "on" : ""} href={`${base}?tab=list`} replace>
            내역
          </Go>
          <Go className={tab === "stats" ? "on" : ""} href={`${base}?tab=stats`} replace>
            통계
          </Go>
        </div>
        {tab === "pocket" && <PocketTab />}
        {tab === "list" && <ListTab />}
        {tab === "stats" && <StatsTab />}
      </div>
    </section>
  );

  function PocketTab() {
    const main = pockets.filter((p) => p.currency === trip.currency && Number(p.budget) + topups.filter((t) => t.pocket_id === p.id).length > 0);
    const tot = main.reduce((s, p) => s + pocketUse(p, expenses, topups).total, 0);
    const used = main.reduce((s, p) => s + pocketUse(p, expenses, topups).used, 0);
    return (
      <div className="pad" style={{ paddingBottom: 24 }}>
        {main.length > 0 && (
          <div className="bsum">
            <div className="sub w">{trip.currency === "KRW" ? "포켓 남은 돈" : `${curName} 포켓 남은 돈`}</div>
            <div className="bs-n">
              {money(tot - used, sym(trip.currency))} {trip.currency !== "KRW" && <span>≈ {money(toKrw(tot - used, trip.currency, trip), "₩")}</span>}
            </div>
            <div className="bs-bar">
              <i style={{ width: `${tot ? Math.min(100, (used / tot) * 100) : 0}%` }} />
            </div>
            <div className="row" style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              <span>{money(used, sym(trip.currency))} 사용</span>
              <span>총 예산 {money(tot, sym(trip.currency))}</span>
            </div>
          </div>
        )}
        {pockets.map((p) => {
          const u = pocketUse(p, expenses, topups);
          const st = pkStyle(p);
          const owner = person(p.owner_id);
          const noBudget = u.total <= 0;
          return (
            <Go key={p.id} className="pocket" href={`${base}/pocket/${p.id}`}>
              <div className="pk-h">
                <span className={`pk-ic ${st.c}`}>
                  <Ic n={st.ic} />
                </span>
                <div className="mid">
                  <b>{p.name}</b>
                  {p.shared && <span className="tag acc sm">공동</span>}
                  {!p.shared && owner && members.length > 1 && owner.id !== user.id && (
                    <span className="tag sm" style={{ background: owner.color, color: "#fff" }}>
                      {owner.nickname}
                    </span>
                  )}
                  <span className={`cur${p.currency === "KRW" ? " k" : ""}`}>{p.currency}</span>
                </div>
                <div className="pk-n">
                  <b>{money(noBudget ? u.used : u.left, sym(p.currency))}</b>
                  <span>{noBudget ? "사용" : "남음"}</span>
                </div>
              </div>
              {!noBudget && (
                <div className="bar">
                  <i style={{ width: `${u.pct}%`, background: st.color }} />
                </div>
              )}
              <div className="pk-f" style={noBudget ? { marginTop: 8 } : undefined}>
                {noBudget ? (
                  <span>예산 없음</span>
                ) : p.shared && members.length > 1 ? (
                  <>
                    <span className="names xs">
                      {people.map((m) => (
                        <span key={m.id} className="nm" style={{ background: m.color }}>
                          {m.nickname}
                        </span>
                      ))}
                    </span>
                    <span> 1인 {money(u.total / members.length, sym(p.currency))}</span>
                    <span>{u.pct}%</span>
                  </>
                ) : (
                  <>
                    <span>
                      {money(u.used, sym(p.currency))} / {money(u.total, sym(p.currency))}
                      {u.added > 0 && <em className="topped"> +{money(u.added, sym(p.currency))} 채움</em>}
                    </span>
                    <span>{u.pct}%</span>
                  </>
                )}
              </div>
            </Go>
          );
        })}
        <Go className="addline" href={`${base}/pocket/new`}>
          <Ic n="plus" /> 예산 포켓 만들기
        </Go>
      </div>
    );
  }

  function ListTab() {
    type Row = { key: string; day: string; sort: string; el: React.ReactNode; krw: number; cur?: string; amt?: number };
    const rows: Row[] = expenses.map((e) => {
      const pk = pockets.find((p) => p.id === e.pocket_id);
      const payer = person(e.payer_id);
      const c = expCat(e.category);
      const split = e.split?.members?.length ?? 0;
      return {
        key: e.id,
        day: e.day ?? "pre",
        sort: e.time_text ?? "",
        krw: krw(e),
        cur: e.currency,
        amt: Number(e.amount),
        el: (
          <Go key={e.id} className="exc" href={`${base}/${e.id}`}>
            <span className={`ec ${c.ec}`}>
              <Ic n={c.ic as IcName} />
            </span>
            <div className="mid">
              <b>{e.title}</b>
              <div className="s">
                {[e.time_text].filter(Boolean).join("")}
                {e.time_text ? " · " : ""}
                {!e.payer_id ? (
                  <span className="pk team">{pk?.name ?? "공동경비"}</span>
                ) : pk ? (
                  <span className={`pk ${pk.kind}`}>{pk.name}</span>
                ) : (
                  <span className="pk bank">{payer?.id === user.id ? "내가 냄" : `${payer?.nickname ?? ""} 냄`}</span>
                )}
                {e.booking_id && (
                  <>
                    {" · "}
                    <Ic n="link" /> 예약 연결
                  </>
                )}
              </div>
            </div>
            <div className="ea">
              <b>{money(Number(e.amount), sym(e.currency))}</b>
              <span>{split > 1 ? `1인 ${Math.round(krw(e) / split).toLocaleString()}원` : e.currency !== "KRW" ? `${Math.round(krw(e)).toLocaleString()}원` : ""}</span>
            </div>
          </Go>
        ),
      };
    });
    for (const t of transfers) {
      const dd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date(t.created_at));
      const tm = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" }).format(new Date(t.created_at));
      rows.push({
        key: t.id,
        day: ds.includes(dd) ? dd : "pre",
        sort: tm,
        krw: 0,
        el: (
          <Go key={t.id} className="exc" href={`${base}/settle`}>
            <span className="ec blue">
              <Ic n="arrow-left-right" />
            </span>
            <div className="mid">
              <b>
                돈 갚음 ({person(t.from_id)?.nickname} → {person(t.to_id)?.nickname})
              </b>
              <div className="s">{tm}</div>
            </div>
            <div className="ea in">
              <b>+ {money(Number(t.amount), "₩")}</b>
              <span>정산</span>
            </div>
          </Go>
        ),
      });
    }
    const keys = ["pre", ...ds];
    const show = d === "all" ? [...ds].reverse().concat("pre") : [d];
    const filtered = rows.filter((r) => show.includes(r.day));
    const sum = filtered.reduce((s, r) => s + r.krw, 0);
    const mine = pockets.find((p) => !p.shared && p.owner_id === user.id && p.currency === trip.currency) ?? pockets.find((p) => p.currency === trip.currency) ?? pockets[0];
    const mu = mine ? pocketUse(mine, expenses, topups) : null;
    return (
      <>
        <div className="dsel">
          <Go className={d === "all" ? "on" : ""} href={`${base}?tab=list`} replace>
            <span>전체</span>
            <b>A</b>
          </Go>
          <Go className={d === "pre" ? "on" : ""} href={`${base}?tab=list&d=pre`} replace>
            <span>준비</span>
            <b>P</b>
          </Go>
          <i />
          {ds.map((x) => (
            <Go key={x} className={`${d === x ? "on" : ""}${weekday(x) === "일" ? " sun" : ""}`} href={`${base}?tab=list&d=${x}`} replace>
              <span>{weekday(x)}</span>
              <b>{parseDate(x).getDate()}</b>
            </Go>
          ))}
        </div>
        <div className="sum2">
          <div>
            <span className="sub">{d === "all" ? "전체 지출" : d === "pre" ? "준비 · 여행 전" : mdLong(d)}</span>
            <b>{money(sum, "₩")}</b>
          </div>
          {mine && mu ? (
            <Go href={`${base}/pocket/${mine.id}`}>
              <span className="sub row">
                남은 돈{" "}
                <em style={{ color: pkStyle(mine).color, fontStyle: "normal", fontWeight: 700 }}>
                  {mine.name} <Ic n="chevron-right" />
                </em>
              </span>
              <b>{money(mu.left, sym(mine.currency))}</b>
              <div className="bar thin">
                <i style={{ width: `${100 - mu.pct}%`, background: pkStyle(mine).color }} />
              </div>
            </Go>
          ) : (
            <Go href={`${base}/pocket/new`}>
              <span className="sub">남은 돈</span>
              <b style={{ fontSize: 14, color: "var(--sub)" }}>포켓 만들기</b>
            </Go>
          )}
        </div>
        <div className="pad" style={{ paddingBottom: 70 }}>
          {show.map((g) => {
            const rs = filtered.filter((r) => r.day === g).sort((a, b) => b.sort.localeCompare(a.sort));
            if (!rs.length) return null;
            const no = ds.indexOf(g) + 1;
            return (
              <Fragment key={g}>
                <div className="dh">
                  <span>{g === "pre" ? "준비 · 여행 전" : `${mdLong(g)}${no ? ` · DAY ${no}` : ""}`}</span>
                  <span>{new Set(rs.filter((r) => r.cur).map((r) => r.cur)).size === 1 && rs.every((r) => r.cur) ? money(rs.reduce((s, r) => s + (r.amt ?? 0), 0), sym(rs[0].cur!)) : money(rs.reduce((s, r) => s + r.krw, 0), "₩")}</span>
                </div>
                {rs.map((r) => r.el)}
              </Fragment>
            );
          })}
          {filtered.length === 0 && (
            <div className="sub" style={{ textAlign: "center", padding: "40px 0 10px" }}>
              {keys.includes(d) || d === "all" ? "아직 쓴 돈이 없어요" : ""}
            </div>
          )}
          <Go className="addline" href={`${base}/new${d !== "all" && d !== "pre" ? `?day=${d}` : ""}`}>
            <Ic n="plus" /> 지출 추가
          </Go>
        </div>
      </>
    );
  }

  function StatsTab() {
    const cats = [...EXP_CATS.map((c) => c.key as string), ...Array.from(new Set(expenses.map((e) => e.category))).filter((k) => !EXP_CATS.some((c) => c.key === k))];
    const byCat = cats
      .map((k) => ({ ...expCat(k), key: k, v: expenses.filter((e) => e.category === k).reduce((s, e) => s + krw(e), 0) }))
      .filter((c) => c.v > 0)
      .sort((a, b) => b.v - a.v);
    let acc = 0;
    const grad = byCat.map((c) => {
      const a = (acc / (total || 1)) * 100;
      acc += c.v;
      return `${c.color} ${a}% ${(acc / (total || 1)) * 100}%`;
    });
    const top = byCat[0];
    const byPocket = [
      ...pockets.map((p) => ({ name: p.name, color: pkStyle(p).color, v: expenses.filter((e) => e.pocket_id === p.id).reduce((s, e) => s + krw(e), 0) })),
      { name: "포켓 없이", color: "var(--sub)", v: expenses.filter((e) => !e.pocket_id).reduce((s, e) => s + krw(e), 0) },
    ].filter((x) => x.v > 0);
    const pmax = Math.max(1, ...byPocket.map((x) => x.v));
    const st = settle(trip, members, expenses, transfers);
    const pp = (x: string) => person(x) ?? { nickname: "?", color: "#8B95A1" };
    return (
      <div className="pad" style={{ paddingBottom: 24 }}>
        <div className="boxc row">
          <span className="sub">총 지출</span>
          <b style={{ fontSize: 22, letterSpacing: "-.5px" }}>{money(total, "₩")}</b>
        </div>
        <div className="stt">카테고리별</div>
        <div className="boxc" style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div className="donut" style={{ background: byCat.length ? `conic-gradient(${grad.join(",")})` : "var(--soft)" }}>
            <div>
              <span className="sub">{top?.key ?? "없음"}</span>
              <b>{top ? `${Math.round((top.v / total) * 100)}%` : "0%"}</b>
            </div>
          </div>
          <div className="mid legend">
            {byCat.map((c) => (
              <div key={c.key}>
                <i style={{ background: c.color }} />
                {c.key}
                <span>{money(c.v, "₩")}</span>
              </div>
            ))}
            {byCat.length === 0 && <div className="sub">아직 쓴 돈이 없어요</div>}
          </div>
        </div>
        {byPocket.length > 0 && (
          <>
            <div className="stt">포켓별</div>
            <div className="boxc">
              {byPocket.map((x) => (
                <Fragment key={x.name}>
                  <div className="brow">
                    <span>{x.name}</span>
                    <b>{money(x.v, "₩")}</b>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${(x.v / pmax) * 100}%`, background: x.color }} />
                  </div>
                </Fragment>
              ))}
            </div>
          </>
        )}
        {members.length > 1 && (
          <>
            <div className="stt row">
              정산{" "}
              <Go as="span" className="sub" href={`${base}/settle`} style={{ fontWeight: 600 }}>
                자세히 <Ic n="chevron-right" />
              </Go>
            </div>
            <Go className="boxc settle" href={`${base}/settle`}>
              {transfers.slice(-2).map((t) => (
                <div key={t.id}>
                  <span className="av xs">
                    <i style={{ background: pp(t.from_id).color }}>{pp(t.from_id).nickname.slice(0, 1)}</i>
                  </span>
                  {pp(t.from_id).nickname} → {pp(t.to_id).nickname}
                  <b>{money(Number(t.amount), "₩")}</b>
                  <span className="tag green">완료</span>
                </div>
              ))}
              {st.moves.map((m, i) => (
                <div key={i}>
                  <span className="av xs">
                    <i style={{ background: pp(m.from).color }}>{pp(m.from).nickname.slice(0, 1)}</i>
                  </span>
                  {pp(m.from).nickname} → {pp(m.to).nickname}
                  <b>{money(m.amount, "₩")}</b>
                  <span className="tag acc">남음</span>
                </div>
              ))}
              {st.moves.length === 0 && transfers.length === 0 && <div className="sub">나눠 낸 돈이 없어요</div>}
            </Go>
          </>
        )}
      </div>
    );
  }
}
