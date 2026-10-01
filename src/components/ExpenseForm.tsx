"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EXP_CATS, money, pocketUse, sym, toKrw } from "@/lib/money";
import { md, nowTime, today } from "@/lib/format";
import { ExpIcon, POCKET_ICON } from "@/components/icons";
import FormHeader from "@/components/ui/FormHeader";
import type { Expense, Pocket, Trip } from "@/lib/types";

type M = { id: string; nickname: string; color: string };
type Props = {
  trip: Pick<Trip, "id" | "currency" | "rate" | "rate_unit">;
  days: string[];
  me: string;
  members: M[];
  pockets: Pocket[];
  expenses: Expense[];
  expense?: Expense;
};

export default function ExpenseForm({ trip, days, me, members, pockets, expenses, expense }: Props) {
  const router = useRouter();
  const edit = !!expense;
  const now = today();
  const hasShared = pockets.some((p) => p.shared);
  const [payer, setPayer] = useState<string>(expense ? expense.payer_id ?? "shared" : me);
  const [pocketId, setPocketId] = useState<string>(expense?.pocket_id ?? "");
  const [cur, setCur] = useState(expense?.currency ?? trip.currency);
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [cat, setCat] = useState(expense?.category ?? "식비");
  const [title, setTitle] = useState(expense?.title ?? "");
  const [day, setDay] = useState<string>(expense ? expense.day ?? "pre" : days.includes(now) ? now : "pre");
  const [time, setTime] = useState(expense?.time_text ?? (days.includes(now) ? nowTime() : ""));
  const [memo, setMemo] = useState(expense?.memo ?? "");
  const [split, setSplit] = useState<string[]>(expense ? expense.split?.members ?? [] : members.length > 1 ? members.map((m) => m.id) : []);
  const [busy, setBusy] = useState(false);

  const amt = Number(amount.replace(/,/g, "")) || 0;
  const curs = Array.from(new Set([trip.currency, "KRW"]));
  const shared = payer === "shared";
  const myPockets = pockets.filter((p) => (shared ? p.shared : !p.shared && (p.owner_id === payer || !p.owner_id)));
  const pocket = pockets.find((p) => p.id === pocketId);

  function pickPayer(p: string) {
    setPayer(p);
    const pk = pockets.find((x) => x.id === pocketId);
    if (pk && (p === "shared" ? !pk.shared : pk.shared || (pk.owner_id && pk.owner_id !== p))) setPocketId("");
    if (p === "shared") {
      const first = pockets.find((x) => x.shared);
      if (first) {
        setPocketId(first.id);
        setCur(first.currency);
      }
    }
  }

  function pickPocket(id: string) {
    setPocketId(id === pocketId ? "" : id);
    const p = pockets.find((x) => x.id === id);
    if (p && id !== pocketId) setCur(p.currency);
  }

  async function save() {
    if (!amt || !title.trim()) return;
    setBusy(true);
    const row = {
      trip_id: trip.id,
      payer_id: shared ? null : payer,
      pocket_id: pocketId || null,
      amount: amt,
      currency: cur,
      category: cat,
      title: title.trim(),
      day: day === "pre" ? null : day,
      time_text: time.trim() || null,
      memo: memo.trim() || null,
      split: !shared && split.length > 1 ? { members: split } : null,
    };
    const supabase = createClient();
    const { error } = edit ? await supabase.from("expenses").update(row).eq("id", expense!.id) : await supabase.from("expenses").insert(row);
    setBusy(false);
    if (error) return alert("저장하지 못했어요");
    router.replace(`/trips/${trip.id}/money?tab=list`);
    router.refresh();
  }

  async function remove() {
    if (!expense || !confirm("이 지출을 지울까요?")) return;
    const { error } = await createClient().from("expenses").delete().eq("id", expense.id);
    if (error) return alert("지우지 못했어요");
    router.replace(`/trips/${trip.id}/money?tab=list`);
    router.refresh();
  }

  const who = (id: string) => members.find((m) => m.id === id);

  return (
    <main className="pb-10">
      <FormHeader title={edit ? "지출" : "지출 쓰기"} onSave={save} canSave={!!amt && !!title.trim()} busy={busy} />
      <div className="px-5">
        <div className="mt-3 flex justify-center gap-1.5">
          {curs.map((c) => (
            <button key={c} onClick={() => setCur(c)} className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${cur === c ? "bg-char text-white" : "text-sub"}`}>
              {sym(c).trim()} {c}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center">
          <span className="text-[38px] font-extrabold tracking-tight">{sym(cur).trim()}</span>
          <input
            className="w-[60%] bg-transparent text-center text-[38px] font-extrabold tracking-tight outline-none placeholder:text-sub2"
            inputMode="decimal"
            autoFocus={!edit}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0"
          />
        </div>
        {cur !== "KRW" && <div className="text-center text-[13px] text-sub">≈ {money(toKrw(amt, cur, trip), "")}원</div>}

        <label className="flab">누가 냈나요?</label>
        <div className="flex flex-wrap gap-1.5">
          {hasShared && (
            <button className={`chip flex items-center gap-1.5 ${shared ? "on" : ""}`} onClick={() => pickPayer("shared")}>
              <Users size={15} /> 공동경비
            </button>
          )}
          {members.map((m) => (
            <button key={m.id} className={`chip flex items-center gap-1.5 ${payer === m.id ? "on" : ""}`} onClick={() => pickPayer(m.id)}>
              <span className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: m.color }}>
                {m.nickname.slice(0, 1)}
              </span>
              {m.id === me ? "나" : m.nickname}
            </button>
          ))}
        </div>

        {myPockets.length > 0 && (
          <>
            <label className="flab">
              어느 포켓에서요? {!shared && <span className="font-medium text-sub">선택</span>}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {myPockets.map((p) => {
                const I = POCKET_ICON[p.kind];
                const u = pocketUse(p, expenses.filter((e) => e.id !== expense?.id));
                return (
                  <button
                    key={p.id}
                    onClick={() => pickPocket(p.id)}
                    className={`flex items-center gap-2.5 rounded-2xl border-[1.5px] bg-white p-3 text-left ${pocketId === p.id ? "border-char" : "border-line"}`}
                  >
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-sky-s text-sky-d">
                      <I size={18} />
                    </span>
                    <span className="min-w-0">
                      <b className="block truncate text-[14.5px]">{p.name}</b>
                      <span className="block truncate text-[12px] text-sub">{money(u.left, sym(p.currency))} 남음</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {shared ? (
          <p className="mt-3 rounded-xl bg-sky-s px-4 py-3 text-[13.5px] font-semibold text-sky-d">공동 포켓에서 빠져요 · 정산 없음</p>
        ) : (
          members.length > 1 && (
            <>
              <label className="flab">누구 몫이에요?</label>
              <div className="flex flex-wrap gap-1.5">
                <button className={`chip ${split.length <= 1 ? "on" : ""}`} onClick={() => setSplit([])}>
                  {payer === me ? "내 거" : `${who(payer)?.nickname ?? ""} 거`}
                </button>
                {members.map((m) => (
                  <button
                    key={m.id}
                    className={`chip ${split.length > 1 && split.includes(m.id) ? "on" : ""}`}
                    onClick={() => {
                      const base = split.length > 1 ? split : [payer];
                      const next = base.includes(m.id) ? base.filter((x) => x !== m.id) : [...base, m.id];
                      setSplit(next.length > 1 ? next : []);
                    }}
                  >
                    {m.nickname}
                  </button>
                ))}
              </div>
              {split.length > 1 && (
                <p className="mt-2 text-[13px] text-sub">
                  {split.length}명이 나눠요 · 1인 {money(toKrw(amt, cur, trip) / split.length, "₩")}
                </p>
              )}
            </>
          )
        )}

        <label className="flab">카테고리</label>
        <div className="grid grid-cols-4 gap-2">
          {EXP_CATS.map((c) => (
            <button key={c.key} onClick={() => setCat(c.key)} className="flex flex-col items-center gap-1 text-[12.5px] font-semibold">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${cat === c.key ? "bg-char text-white" : "bg-white text-ink2"}`}>
                <ExpIcon cat={c.key} />
              </span>
              <span className={cat === c.key ? "text-ink" : "text-sub"}>{c.key}</span>
            </button>
          ))}
        </div>

        <label className="flab">내용</label>
        <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 이치란 라멘" />

        <label className="flab">언제</label>
        <div className="flex flex-wrap gap-1.5">
          <button className={`chip ${day === "pre" ? "on" : ""}`} onClick={() => setDay("pre")}>
            준비 · 여행 전
          </button>
          {days.map((d, i) => (
            <button key={d} className={`chip ${day === d ? "on" : ""}`} onClick={() => setDay(d)}>
              DAY {i + 1} · {md(d)}
            </button>
          ))}
        </div>
        {day !== "pre" && <input className="inp mt-2" value={time} onChange={(e) => setTime(e.target.value)} placeholder="시간 예) 13:05" inputMode="numeric" />}

        <label className="flab">
          메모 <span className="font-medium text-sub">선택</span>
        </label>
        <input className="inp" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예) 카드 안 돼서 현금으로 냄" />

        {pocket && pocket.currency !== cur && <p className="mt-3 text-[12.5px] text-red">포켓 통화({pocket.currency})와 달라서 포켓 잔액에는 안 들어가요</p>}

        {edit && (
          <button className="dellink w-full" onClick={remove}>
            <Trash2 size={16} /> 지출 삭제
          </button>
        )}
      </div>
    </main>
  );
}
