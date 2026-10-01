import { loadMoney } from "@/lib/moneyload";
import { money, settle, toKrw } from "@/lib/money";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import LiveRefresh from "@/components/LiveRefresh";
import { MoveRow, SettleButtons, UndoTransfer } from "@/components/SettleActions";

export default async function SettlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trip, members, expenses, transfers, people } = await loadMoney(id);
  const st = settle(trip, members, expenses, transfers);
  const p = (x: string) => people.find((m) => m.id === x) ?? { id: x, nickname: "?", color: "#8B95A1" };
  const max = Math.max(1, ...Object.values(st.paid));
  const sharedSum = expenses.filter((e) => !e.payer_id).reduce((s, e) => s + toKrw(Number(e.amount), e.currency, trip), 0);
  const n = Math.max(1, members.length);
  const moves = st.moves.map((m) => ({ ...m, label: `${p(m.from).nickname} → ${p(m.to).nickname}` }));
  const text = [`[${trip.title}] 정산`, `함께 쓴 돈 ${money(st.total, "₩")} · 1인 ${money(st.total / n, "₩")}`, ...moves.map((m) => `${m.label} ${money(m.amount, "₩")}`)].join("\n");
  const Av = ({ id: uid }: { id: string }) => (
    <span className="av xs">
      <i style={{ background: p(uid).color }}>{p(uid).nickname.slice(0, 1)}</i>
    </span>
  );
  const sd = (s: string) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric" }).format(new Date(s)).replace(/\. /g, "/").replace(".", "");

  return (
    <section className="screen on" id="settle">
      <LiveRefresh tripId={id} table="transfers" />
      <div className="scr nonav">
        <div className="hd">
          <Go as="span" className="ib" back>
            <Ic n="chevron-left" />
          </Go>
          <h2>정산</h2>
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          <div className="bsum" style={{ marginTop: 4 }}>
            <div className="sub w">함께 쓴 돈 (나눠 내기 설정된 지출)</div>
            <div className="bs-n">{money(st.total, "₩")}</div>
            <div className="row" style={{ fontSize: 12.5, opacity: 0.75, marginTop: 6 }}>
              <span>{members.length}명</span>
              <span>1인 {money(st.total / n, "₩")}</span>
            </div>
          </div>
          <div className="stt">누가 얼마 냈나</div>
          <div className="boxc paid">
            {people.map((m) => (
              <div key={m.id}>
                <Av id={m.id} />
                <b>{m.nickname}</b>
                <div className="pbar">
                  <i style={{ width: `${(st.paid[m.id] / max) * 100}%`, background: m.color }} />
                </div>
                <em>{money(st.paid[m.id], "₩")}</em>
              </div>
            ))}
          </div>
          <div className="stt">이렇게 보내면 끝나요</div>
          <div className="boxc sendl">
            {transfers.map((t) => (
              <div key={t.id}>
                <Av id={t.from_id} />
                <span className="arr">
                  <Ic n="arrow-right" />
                </span>
                <Av id={t.to_id} />
                <div className="mid">
                  <b>
                    {p(t.from_id).nickname} → {p(t.to_id).nickname}
                  </b>
                  <div className="s">
                    {money(Number(t.amount), "₩")} 보냄 · {sd(t.created_at)}
                  </div>
                </div>
                <UndoTransfer id={t.id} />
              </div>
            ))}
            {moves.map((m, i) => (
              <MoveRow key={i} tripId={id} m={m}>
                <Av id={m.from} />
                <span className="arr">
                  <Ic n="arrow-right" />
                </span>
                <Av id={m.to} />
                <div className="mid">
                  <b>{m.label}</b>
                  <div className="s">{transfers.some((t) => t.from_id === m.from && t.to_id === m.to) ? "남은 금액" : "아직 안 보냄"}</div>
                </div>
                <b className="amt2">{money(m.amount, "₩")}</b>
              </MoveRow>
            ))}
            {moves.length === 0 && transfers.length === 0 && <div className="sub">나눠 낸 돈이 없어요</div>}
          </div>
          <SettleButtons tripId={id} text={text} moves={moves} />
          {sharedSum > 0 && (
            <div className="tip">
              <Ic n="users" /> 공동경비 예산에서 쓴 돈은 이미 같이 낸 돈이라 정산에서 빠져요.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
