import { notFound } from "next/navigation";
import { loadMoney } from "@/lib/moneyload";
import { days, parseDate, weekday } from "@/lib/format";
import { expCat, money, pocketUse, sym, toKrw } from "@/lib/money";
import Go from "@/components/Go";
import Ic, { type IcName } from "@/components/Ic";
import LiveRefresh from "@/components/LiveRefresh";
import { DelTopUp, TopUpButton } from "@/components/TopUp";

const sd = (d: string | null) => (d ? `${+d.split("-")[1]}/${+d.split("-")[2]}` : "준비");

export default async function PocketDetail({ params, searchParams }: { params: Promise<{ id: string; pid: string }>; searchParams: Promise<{ d?: string }> }) {
  const { id, pid } = await params;
  const { d = "all" } = await searchParams;
  const { trip, pockets, expenses, topups } = await loadMoney(id);
  const p = pockets.find((x) => x.id === pid);
  if (!p) notFound();
  const u = pocketUse(p, expenses, topups);
  const s = sym(p.currency);
  const tops = topups.filter((t) => t.pocket_id === p.id);
  const ds = days(trip.start_date, trip.end_date);
  const here = `/trips/${id}/money/pocket/${pid}`;
  const all = expenses.filter((e) => e.pocket_id === p.id).sort((a, b) => `${b.day ?? ""}${b.time_text ?? ""}`.localeCompare(`${a.day ?? ""}${a.time_text ?? ""}`));
  const spent = d === "all" ? all : all.filter((e) => (d === "pre" ? !e.day || !ds.includes(e.day) : e.day === d));
  const spentSum = spent.reduce((x, e) => x + Number(e.amount), 0);

  return (
    <section className="screen on" id="pocketDetail">
      <LiveRefresh tripId={id} table="topups" />
      <div className="scr">
        <div className="hd">
          <Go as="span" className="ib" href={`/trips/${id}/money`}>
            <Ic n="chevron-left" />
          </Go>
          <h2>{p.name}</h2>
          <Go as="span" className="ib" href={`/trips/${id}/money/pocket/${pid}/edit`}>
            <Ic n="pencil" />
          </Go>
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          <div className="bsum" style={{ marginTop: 4 }}>
            <div className="sub w">{u.total > 0 ? "잔여 경비" : "사용 금액"}</div>
            <div className="bs-n">
              {money(u.total > 0 ? u.left : u.used, s)} {p.currency !== "KRW" && <span>≈ {money(toKrw(u.total > 0 ? u.left : u.used, p.currency, trip), "₩")}</span>}
            </div>
            {u.total > 0 && (
              <>
                <div className="bs-bar">
                  <i style={{ width: `${u.pct}%` }} />
                </div>
                <div className="row" style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                  <span>사용 금액 {money(u.used, s)}</span>
                  <span>총 예산 {money(u.total, s)}</span>
                </div>
              </>
            )}
          </div>
          <div className="btns2">
            <TopUpButton p={p} />
            <Go href={`/trips/${id}/money?tab=list`}>
              <Ic n="receipt" /> 지출 내역
            </Go>
          </div>

          <div className="stt row">
            예산 내역{" "}
            <span className="sub" style={{ fontWeight: 600 }}>
              {tops.length + (Number(p.budget) > 0 ? 1 : 0)}번 · {money(u.total, s)}
            </span>
          </div>
          <div className="boxc tops">
            {Number(p.budget) > 0 && (
              <div>
                <span className="tp-ic">
                  <Ic n="arrow-down-to-line" />
                </span>
                <div className="mid">
                  <b>초기 예산</b>
                  <div className="s">예산 생성 시</div>
                </div>
                <div className="ea">
                  <b className="plus">+ {money(Number(p.budget), s)}</b>
                  {p.currency !== "KRW" && <span>{money(toKrw(Number(p.budget), p.currency, trip), "₩")}</span>}
                </div>
              </div>
            )}
            {tops.map((t) => (
              <div key={t.id}>
                <span className="tp-ic">
                  <Ic n="arrow-down-to-line" />
                </span>
                <div className="mid">
                  <b>{t.how || "예산 추가"}</b>
                  <div className="s">{[sd(t.day), t.memo, t.rate_text].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="ea">
                  <b className="plus">+ {money(Number(t.amount), s)}</b>
                  {t.krw ? <span>{money(Number(t.krw), "₩")}</span> : null}
                </div>
                <DelTopUp id={t.id} />
              </div>
            ))}
            {Number(p.budget) <= 0 && tops.length === 0 && <div className="sub">예산 내역이 없어요</div>}
          </div>

          <div className="stt row">
            최근 지출
            <span className="sub" style={{ fontWeight: 600 }}>
              {spent.length}건 · {money(spentSum, sym(p.currency))}
            </span>
          </div>
          <div className="dsel" style={{ margin: "8px -16px 10px", padding: "0 16px" }}>
            <Go className={d === "all" ? "on" : ""} href={here} replace keep>
              <span>전체</span>
              <b>A</b>
            </Go>
            <Go className={d === "pre" ? "on" : ""} href={`${here}?d=pre`} replace keep>
              <span>준비</span>
              <b>P</b>
            </Go>
            <i />
            {ds.map((x) => (
              <Go key={x} className={`${d === x ? "on" : ""}${weekday(x) === "일" ? " sun" : ""}`} href={`${here}?d=${x}`} replace keep>
                <span>{weekday(x)}</span>
                <b>{parseDate(x).getDate()}</b>
              </Go>
            ))}
          </div>
          <div className="boxc tops">
            {spent.slice(0, d === "all" ? 20 : 200).map((e) => {
              const c = expCat(e.category);
              return (
                <Go key={e.id} href={`/trips/${id}/money/${e.id}`}>
                  <span className={`ec ${c.ec}`}>
                    <Ic n={c.ic as IcName} />
                  </span>
                  <div className="mid">
                    <b>{e.title}</b>
                    <div className="s">
                      {sd(e.day)} {e.time_text ?? ""}
                    </div>
                  </div>
                  <div className="ea">
                    <b>- {money(Number(e.amount), sym(e.currency))}</b>
                  </div>
                </Go>
              );
            })}
            {spent.length === 0 && <div className="sub">지출 내역이 없어요</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
