import Link from "next/link";
import { ArrowLeftRight, ChevronRight, Plus } from "lucide-react";
import { loadMoney } from "@/lib/moneyload";
import { days, mdLong, parseDate, weekday } from "@/lib/format";
import { EXP_CATS, expColor, money, pocketUse, settle, sym, toKrw } from "@/lib/money";
import { ExpIcon, POCKET_ICON } from "@/components/icons";
import LiveRefresh from "@/components/LiveRefresh";
import type { Expense } from "@/lib/types";

const POCKET_BAR = { cash: "#C98A12", card: "#6B54B8", bank: "#3E9A6A" } as const;

export default async function MoneyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; d?: string }> }) {
  const { id } = await params;
  const { tab = "pocket", d = "all" } = await searchParams;
  const { trip, members, pockets, expenses, transfers, people } = await loadMoney(id);
  const ds = days(trip.start_date, trip.end_date);
  const person = (pid: string | null) => people.find((p) => p.id === pid);
  const krw = (e: Expense) => toKrw(Number(e.amount), e.currency, trip);
  const total = expenses.reduce((s, e) => s + krw(e), 0);
  const st = settle(trip, members, expenses, transfers);
  const base = `/trips/${id}/money`;

  return (
    <main>
      <LiveRefresh tripId={id} table="expenses" />
      <LiveRefresh tripId={id} table="pockets" />
      <header className="hd !pb-1">
        <h1 className="!text-[24px]">경비</h1>
        {members.length > 1 && (
          <Link href={`${base}/settle`} className="ib" aria-label="정산">
            <ArrowLeftRight size={20} />
          </Link>
        )}
        <Link href={tab === "pocket" && pockets.length === 0 ? `${base}/pocket/new` : `${base}/new`} className="ib" aria-label="추가">
          <Plus size={22} />
        </Link>
      </header>
      <nav className="tabs sticky top-[60px] z-10">
        <Link href="?tab=pocket" className={tab === "pocket" ? "on" : ""}>
          포켓
        </Link>
        <Link href="?tab=list" className={tab === "list" ? "on" : ""}>
          내역
        </Link>
        <Link href="?tab=stats" className={tab === "stats" ? "on" : ""}>
          통계
        </Link>
      </nav>

      {tab === "pocket" && <PocketTab />}
      {tab === "list" && <ListTab />}
      {tab === "stats" && <StatsTab />}
    </main>
  );

  function PocketTab() {
    const main = pockets.filter((p) => p.currency === trip.currency);
    const budget = main.reduce((s, p) => s + Number(p.budget), 0);
    const used = main.reduce((s, p) => s + pocketUse(p, expenses).used, 0);
    const pct = budget ? Math.min(100, (used / budget) * 100) : 0;
    return (
      <div className="px-4 pt-3">
        {main.length > 0 && (
          <section className="card p-5">
            <span className="s13">{trip.currency === "KRW" ? "포켓 남은 돈" : `${trip.currency} 포켓 남은 돈`}</span>
            <div className="mt-1 flex items-baseline gap-2">
              <b className="text-[30px] font-extrabold tracking-tight">{money(budget - used, sym(trip.currency))}</b>
              {trip.currency !== "KRW" && <span className="text-[13px] text-sub">≈ {money(toKrw(budget - used, trip.currency, trip), "₩")}</span>}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-sky" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[12.5px] text-sub">
              <span>{money(used, sym(trip.currency))} 사용</span>
              <span>총 예산 {money(budget, sym(trip.currency))}</span>
            </div>
          </section>
        )}

        {pockets.length > 0 && (
          <section className="card mt-2.5 px-4">
            {pockets.map((p, i) => {
              const u = pocketUse(p, expenses);
              const I = POCKET_ICON[p.kind];
              const owner = person(p.owner_id);
              return (
                <Link key={p.id} href={`${base}/pocket/${p.id}`} className={`block py-4 ${i ? "border-t border-line" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-bg text-ink2">
                      <I size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <b className="text-[16px]">{p.name}</b>
                        {p.shared && <span className="rounded-md bg-sky-s px-1.5 py-0.5 text-[11px] font-bold text-sky-d">공동</span>}
                        {!p.shared && owner && members.length > 1 && (
                          <span className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ background: owner.color }}>
                            {owner.nickname}
                          </span>
                        )}
                        <span className="rounded-md bg-bg px-1.5 py-0.5 text-[11px] font-bold text-sub">{p.currency}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <b className={`block text-[17px] ${u.left < 0 ? "text-red" : ""}`}>{money(u.left, sym(p.currency))}</b>
                      <span className="text-[12px] text-sub">남음</span>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-bg">
                    <div className="h-full rounded-full" style={{ width: `${u.pct}%`, background: p.shared ? "#4DA3FF" : POCKET_BAR[p.kind] }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[12.5px] text-sub">
                    <span>
                      {money(u.used, sym(p.currency))} / {money(Number(p.budget), sym(p.currency))}
                      {p.shared && members.length > 1 ? ` · 1인 ${money(Number(p.budget) / members.length, sym(p.currency))}` : ""}
                    </span>
                    <span>{u.pct}%</span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
        {pockets.length === 0 && (
          <div className="py-12 text-center">
            <b className="text-[16px]">포켓이 없어요</b>
            <p className="s13 mt-1">환전한 현금, 트래블카드, 공동경비를 나눠서 관리해요</p>
          </div>
        )}
        <Link href={`${base}/pocket/new`} className="addline mt-3">
          <Plus size={16} /> 포켓 추가
        </Link>

        {members.length > 1 && (
          <Link href={`${base}/settle`} className="card mt-3 flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-s text-sky-d">
              <ArrowLeftRight size={19} />
            </span>
            <span className="flex-1">
              <b className="block text-[15px]">정산</b>
              <span className="s13">{st.moves.length ? `보낼 돈 ${st.moves.length}건` : "다 맞았어요"}</span>
            </span>
            <ChevronRight size={18} className="text-sub2" />
          </Link>
        )}
      </div>
    );
  }

  function ListTab() {
    const keys = ["pre", ...ds];
    const pick = d === "all" ? keys : [d];
    const filtered = expenses.filter((e) => pick.includes(e.day ?? "pre") || (d === "all" && e.day && !ds.includes(e.day)));
    const groups = [...keys, ...Array.from(new Set(expenses.map((e) => e.day).filter((x): x is string => !!x && !ds.includes(x))))].filter((k) => d === "all" || k === d);
    const sum = filtered.reduce((s, e) => s + krw(e), 0);
    return (
      <div className="pt-1">
        <div className="flex items-end gap-3 overflow-x-auto bg-white px-5 pb-3 pt-2">
          {[
            ["all", "전체", "A"],
            ["pre", "준비", "P"],
          ].map(([k, l, c]) => (
            <Link key={k} href={`?tab=list&d=${k}`} className="flex flex-none flex-col items-center gap-1">
              <span className="text-[11.5px] font-semibold text-sub">{l}</span>
              <span className={`grid h-9 w-9 place-items-center rounded-full text-[15px] font-bold ${d === k ? "bg-char text-white" : "text-ink"}`}>{c}</span>
            </Link>
          ))}
          <span className="mb-1 h-7 w-px flex-none bg-line" />
          {ds.map((x) => {
            const w = weekday(x);
            return (
              <Link key={x} href={`?tab=list&d=${x}`} className="flex flex-none flex-col items-center gap-1">
                <span className={`text-[11.5px] font-semibold ${w === "일" ? "text-red" : w === "토" ? "text-sky-d" : "text-sub"}`}>{w}</span>
                <span className={`grid h-9 w-9 place-items-center rounded-full text-[15px] font-bold ${d === x ? "bg-char text-white" : "text-ink"}`}>{parseDate(x).getDate()}</span>
              </Link>
            );
          })}
        </div>

        <div className="px-4">
          <section className="card mt-3 p-4">
            <span className="s13">{d === "all" ? "전체 지출" : d === "pre" ? "준비 · 여행 전" : mdLong(d)}</span>
            <b className="block text-[22px] font-extrabold tracking-tight">{money(sum, "₩")}</b>
          </section>

          {groups.map((g) => {
            const rows = filtered.filter((e) => (e.day ?? "pre") === g);
            if (!rows.length) return null;
            const no = ds.indexOf(g) + 1;
            return (
              <section key={g}>
                <div className="mx-1 mb-2 mt-5 flex justify-between text-[13.5px] font-bold">
                  <span>{g === "pre" ? "준비 · 여행 전" : `${mdLong(g)}${no ? ` · DAY ${no}` : ""}`}</span>
                  <span className="text-sub">{money(rows.reduce((s, e) => s + krw(e), 0), "₩")}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {rows.map((e) => {
                    const pk = pockets.find((p) => p.id === e.pocket_id);
                    const payer = person(e.payer_id);
                    return (
                      <Link key={e.id} href={`${base}/${e.id}`} className="card flex items-center gap-3 p-3.5">
                        <span className="grid h-11 w-11 flex-none place-items-center rounded-xl" style={{ background: `${expColor(e.category)}1a`, color: expColor(e.category) }}>
                          <ExpIcon cat={e.category} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block truncate text-[15.5px] font-semibold">{e.title}</b>
                          <span className="flex items-center gap-1.5 text-[12.5px] text-sub">
                            {e.time_text}
                            {!e.payer_id ? (
                              <span className="rounded-md bg-sky-s px-1.5 py-0.5 text-[11px] font-bold text-sky-d">{pk?.name ?? "공동경비"}</span>
                            ) : (
                              <>
                                {members.length > 1 && payer && (
                                  <span className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ background: payer.color }}>
                                    {payer.nickname}
                                  </span>
                                )}
                                {pk && <span className="rounded-md bg-bg px-1.5 py-0.5 text-[11px] font-bold text-ink2">{pk.name}</span>}
                                {e.split && e.split.members.length > 1 && <span className="text-[11.5px]">{e.split.members.length}명 나눔</span>}
                              </>
                            )}
                          </span>
                        </span>
                        <span className="text-right">
                          <b className="block text-[15.5px] text-sky-d">{money(Number(e.amount), sym(e.currency))}</b>
                          {e.currency !== "KRW" && <span className="text-[12px] text-sub">{Math.round(krw(e)).toLocaleString("ko-KR")}원</span>}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {filtered.length === 0 && <p className="py-12 text-center text-sm text-sub">아직 쓴 돈이 없어요</p>}
          <Link href={`${base}/new`} className="addline mt-4">
            <Plus size={16} /> 지출 쓰기
          </Link>
        </div>
      </div>
    );
  }

  function StatsTab() {
    const byCat = EXP_CATS.map((c) => ({ ...c, v: expenses.filter((e) => e.category === c.key).reduce((s, e) => s + krw(e), 0) }))
      .filter((c) => c.v > 0)
      .sort((a, b) => b.v - a.v);
    const max = Math.max(1, ...byCat.map((c) => c.v));
    const sharedSum = expenses.filter((e) => !e.payer_id).reduce((s, e) => s + krw(e), 0);
    const byPerson = people.map((p) => ({ ...p, v: expenses.filter((e) => e.payer_id === p.id).reduce((s, e) => s + krw(e), 0) }));
    const pmax = Math.max(1, sharedSum, ...byPerson.map((p) => p.v));
    const tripDays = ds.filter((x) => expenses.some((e) => e.day === x)).length;
    return (
      <div className="px-4 pt-3">
        <section className="card p-5">
          <span className="s13">전체 지출</span>
          <b className="block text-[28px] font-extrabold tracking-tight">{money(total, "₩")}</b>
          <div className="mt-1 flex justify-between text-[12.5px] text-sub">
            <span>{members.length > 1 ? `1인 ${money(total / members.length, "₩")}` : ""}</span>
            <span>{tripDays ? `여행 중 하루 ${money(expenses.filter((e) => e.day && ds.includes(e.day)).reduce((s, e) => s + krw(e), 0) / tripDays, "₩")}` : ""}</span>
          </div>
        </section>

        <div className="mx-1 mb-2 mt-5 text-[13.5px] font-bold text-sub">어디에 썼나</div>
        <section className="card p-4">
          {byCat.length === 0 && <p className="py-6 text-center text-sm text-sub">아직 쓴 돈이 없어요</p>}
          {byCat.map((c) => (
            <div key={c.key} className="flex items-center gap-3 py-2">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg" style={{ background: `${c.color}1a`, color: c.color }}>
                <ExpIcon cat={c.key} size={16} />
              </span>
              <span className="w-10 flex-none text-[14px] font-semibold">{c.key}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
                <span className="block h-full rounded-full" style={{ width: `${(c.v / max) * 100}%`, background: c.color }} />
              </span>
              <span className="w-[92px] flex-none text-right text-[13.5px] font-bold">{money(c.v, "₩")}</span>
            </div>
          ))}
        </section>

        {members.length > 1 && (
          <>
            <div className="mx-1 mb-2 mt-5 text-[13.5px] font-bold text-sub">누가 냈나</div>
            <section className="card p-4">
              {[...(sharedSum ? [{ id: "shared", nickname: "공동경비", color: "#4DA3FF", v: sharedSum }] : []), ...byPerson].map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2">
                  <span className="w-16 flex-none truncate text-[14px] font-semibold">{p.nickname}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
                    <span className="block h-full rounded-full" style={{ width: `${(p.v / pmax) * 100}%`, background: p.color }} />
                  </span>
                  <span className="w-[92px] flex-none text-right text-[13.5px] font-bold">{money(p.v, "₩")}</span>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    );
  }
}
