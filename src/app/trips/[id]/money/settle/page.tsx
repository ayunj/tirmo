import Link from "next/link";
import { ArrowRight, ChevronLeft, Users } from "lucide-react";
import { loadMoney } from "@/lib/moneyload";
import { money, settle, toKrw } from "@/lib/money";
import LiveRefresh from "@/components/LiveRefresh";
import { PaidButton, ShareSettle, UndoTransfer } from "@/components/SettleActions";

function Dot({ name, color }: { name: string; color: string }) {
  return (
    <span className="grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: color }}>
      {name.slice(0, 1)}
    </span>
  );
}

export default async function SettlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trip, members, expenses, transfers, people } = await loadMoney(id);
  const st = settle(trip, members, expenses, transfers);
  const p = (x: string) => people.find((m) => m.id === x) ?? { id: x, nickname: "?", color: "#8B95A1" };
  const max = Math.max(1, ...Object.values(st.paid));
  const sharedSum = expenses.filter((e) => !e.payer_id).reduce((s, e) => s + toKrw(Number(e.amount), e.currency, trip), 0);
  const text = [
    `[${trip.title}] 정산`,
    `함께 쓴 돈 ${money(st.total, "₩")} · 1인 ${money(st.total / Math.max(1, members.length), "₩")}`,
    ...st.moves.map((m) => `${p(m.from).nickname} → ${p(m.to).nickname} ${money(m.amount, "₩")}`),
  ].join("\n");

  return (
    <main className="pb-10">
      <LiveRefresh tripId={id} table="transfers" />
      <header className="hd">
        <Link href={`/trips/${id}/money`} className="ib -ml-2" aria-label="뒤로">
          <ChevronLeft size={24} />
        </Link>
        <h1>정산</h1>
      </header>
      <div className="px-4 pt-2">
        <section className="card p-5">
          <span className="s13">함께 쓴 돈 (나눠 내기 한 지출)</span>
          <b className="block text-[30px] font-extrabold tracking-tight">{money(st.total, "₩")}</b>
          <div className="mt-1 flex justify-between text-[12.5px] text-sub">
            <span>{members.length}명</span>
            <span>1인 {money(st.total / Math.max(1, members.length), "₩")}</span>
          </div>
        </section>

        <div className="mx-1 mb-2 mt-5 text-[15px] font-bold">누가 얼마 냈나</div>
        <section className="card p-4">
          {people.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2">
              <Dot name={m.nickname} color={m.color} />
              <span className="w-14 flex-none truncate text-[14.5px] font-semibold">{m.nickname}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
                <span className="block h-full rounded-full" style={{ width: `${(st.paid[m.id] / max) * 100}%`, background: m.color }} />
              </span>
              <b className="w-[92px] flex-none text-right text-[14px]">{money(st.paid[m.id], "₩")}</b>
            </div>
          ))}
        </section>

        <div className="mx-1 mb-2 mt-5 text-[15px] font-bold">이렇게 보내면 끝나요</div>
        <section className="card px-4">
          {st.moves.length === 0 && transfers.length === 0 && <p className="py-6 text-center text-sm text-sub">보낼 돈이 없어요</p>}
          {transfers.map((t) => (
            <div key={t.id} className="flex items-center gap-2 border-b border-line py-3.5">
              <Dot name={p(t.from_id).nickname} color={p(t.from_id).color} />
              <ArrowRight size={14} className="text-sub2" />
              <Dot name={p(t.to_id).nickname} color={p(t.to_id).color} />
              <span className="ml-1 flex-1">
                <b className="block text-[14.5px]">
                  {p(t.from_id).nickname} → {p(t.to_id).nickname}
                </b>
                <span className="text-[12.5px] text-sub">
                  {money(Number(t.amount), "₩")} 보냄 · {new Date(t.created_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", timeZone: "Asia/Seoul" })}
                </span>
              </span>
              <span className="rounded-md bg-[#E4F4EB] px-1.5 py-0.5 text-[11.5px] font-bold text-green">완료</span>
              <UndoTransfer id={t.id} />
            </div>
          ))}
          {st.moves.map((m, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-line py-3.5 last:border-b-0">
              <Dot name={p(m.from).nickname} color={p(m.from).color} />
              <ArrowRight size={14} className="text-sub2" />
              <Dot name={p(m.to).nickname} color={p(m.to).color} />
              <span className="ml-1 flex-1">
                <b className="block text-[14.5px]">
                  {p(m.from).nickname} → {p(m.to).nickname}
                </b>
                <b className="text-[15px] text-sky-d">{money(m.amount, "₩")}</b>
              </span>
              <PaidButton tripId={id} from={m.from} to={m.to} amount={m.amount} label={`${p(m.from).nickname} → ${p(m.to).nickname}`} />
            </div>
          ))}
        </section>

        {st.moves.length > 0 && (
          <div className="mt-4">
            <ShareSettle text={text} />
          </div>
        )}

        {sharedSum > 0 && (
          <p className="mt-4 flex gap-2 rounded-xl bg-sky-s px-4 py-3 text-[13px] leading-relaxed text-sky-d">
            <Users size={16} className="mt-0.5 flex-none" />
            공동경비 {money(sharedSum, "₩")}는 이미 같이 낸 돈이라 정산에서 빠져요.
          </p>
        )}
      </div>
    </main>
  );
}
