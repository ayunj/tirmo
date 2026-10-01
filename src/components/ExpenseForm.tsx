"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EXP_CATS, expCat, money, pkStyle, pocketUse, sym, toKrw } from "@/lib/money";
import { md, nowTime, today } from "@/lib/format";
import { removePhotos } from "@/lib/photo";
import { askDel, toast } from "@/lib/ui";
import Go from "@/components/Go";
import Ic, { type IcName } from "@/components/Ic";
import DatePick from "@/components/ui/DatePick";
import PhotoField from "@/components/ui/PhotoField";
import type { Expense, Pocket, Topup, Trip } from "@/lib/types";

type M = { id: string; nickname: string; color: string };
type Props = {
  trip: Pick<Trip, "id" | "currency" | "rate" | "rate_unit">;
  days: string[];
  me: string;
  members: M[];
  pockets: Pocket[];
  expenses: Expense[];
  topups: Topup[];
  expense?: Expense;
  preset?: { title?: string; day?: string };
};

/** 지출 쓰기 · 고치기 (목업 moneyAdd) */
export default function ExpenseForm({ trip, days, me, members, pockets, expenses, topups, expense, preset }: Props) {
  const router = useRouter();
  const edit = !!expense;
  const now = today();
  const hasShared = pockets.some((p) => p.shared);
  const firstShared = pockets.find((p) => p.shared);
  const [payer, setPayer] = useState<string>(expense ? expense.payer_id ?? "shared" : hasShared ? "shared" : me);
  const [pocketId, setPocketId] = useState<string>(expense ? expense.pocket_id ?? "" : hasShared ? firstShared!.id : "");
  const [cur, setCur] = useState(expense?.currency ?? (hasShared ? firstShared!.currency : trip.currency));
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [cat, setCat] = useState(expense?.category ?? "식비");
  const [title, setTitle] = useState(expense?.title ?? preset?.title ?? "");
  const [day, setDay] = useState<string>(expense ? expense.day ?? "pre" : preset?.day && days.includes(preset.day) ? preset.day : days.includes(now) ? now : "pre");
  const [time, setTime] = useState(expense?.time_text ?? (days.includes(now) ? nowTime() : ""));
  const [memo, setMemo] = useState(expense?.memo ?? "");
  const [photos, setPhotos] = useState<string[]>(expense?.photos ?? []);
  const [splitOn, setSplitOn] = useState(expense ? (expense.split?.members?.length ?? 0) > 1 : false);
  const [spm, setSpm] = useState<string[]>(expense?.split?.members ?? members.map((m) => m.id));
  const [mode, setMode] = useState<"eq" | "own">(expense?.split?.mode ?? "eq");
  const [shares, setShares] = useState<Record<string, string>>(Object.fromEntries(Object.entries(expense?.split?.shares ?? {}).map(([k, v]) => [k, String(v)])));
  const [dp, setDp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const amt = Number(amount.replace(/,/g, "")) || 0;
  const curs = Array.from(new Set([trip.currency, "KRW"]));
  const shared = payer === "shared";
  const list = shared ? pockets.filter((p) => p.shared) : pockets.filter((p) => !p.shared && (!p.owner_id || p.owner_id === payer));
  const others = expenses.filter((e) => e.id !== expense?.id);
  const s = sym(cur).trim();
  const each = spm.length ? amt / spm.length : 0;
  const ownSum = spm.reduce((t, id) => t + (Number(shares[id]) || 0), 0);

  function pickPayer(p: string) {
    setPayer(p);
    const pk = pockets.find((x) => x.id === pocketId);
    if (p === "shared") {
      setSplitOn(false);
      if (firstShared) {
        setPocketId(firstShared.id);
        setCur(firstShared.currency);
      }
    } else if (pk && (pk.shared || (pk.owner_id && pk.owner_id !== p))) setPocketId("");
  }

  async function save() {
    if (!amt) return toast("금액을 적어 주세요");
    if (!title.trim()) return toast("내용을 적어 주세요");
    setBusy(true);
    const split =
      !shared && splitOn && spm.length > 1
        ? mode === "own"
          ? { members: spm, mode: "own" as const, shares: Object.fromEntries(spm.map((id) => [id, Number(shares[id]) || 0])) }
          : { members: spm, mode: "eq" as const }
        : null;
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
      split,
      photos,
    };
    const supabase = createClient();
    const { error } = edit ? await supabase.from("expenses").update(row).eq("id", expense!.id) : await supabase.from("expenses").insert(row);
    setBusy(false);
    if (error) return toast("저장하지 못했어요");
    if (edit) {
      const gone = (expense!.photos || []).filter((p) => !photos.includes(p));
      if (gone.length) removePhotos(gone);
    }
    router.replace(`/trips/${trip.id}/money?tab=list`);
    router.refresh();
  }

  async function remove() {
    if (!expense || !(await askDel("이 지출을 지울까요?", "포켓 잔액과 정산에서도 빠져요"))) return;
    const { error } = await createClient().from("expenses").delete().eq("id", expense.id);
    if (error) return toast("지우지 못했어요");
    removePhotos(expense.photos || []);
    toast("지출을 지웠어요");
    router.replace(`/trips/${trip.id}/money?tab=list`);
    router.refresh();
  }

  const no = days.indexOf(day) + 1;
  const showCats = [...EXP_CATS.map((c) => c.key as string), ...(EXP_CATS.some((c) => c.key === cat) ? [] : [cat])];

  return (
    <section className={`screen on${shared ? " teampay" : ""}${edit ? " editmode" : ""}`} id="moneyAdd">
      <div className="scr nonav">
        <div className="hd">
          <Go as="span" className="ib" back>
            <Ic n="x" />
          </Go>
          <h2>{edit ? "지출 고치기" : "지출 쓰기"}</h2>
          <span className={`txtbtn${busy || uploading ? " off" : ""}`} onClick={save}>
            저장
          </span>
        </div>
        <div className="pad">
          <div className="amt">
            <div className="curtg">
              {curs.map((c) => (
                <span key={c} className={cur === c ? "on" : ""} onClick={() => setCur(c)}>
                  {sym(c).trim()} {c}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", marginTop: 10 }}>
              <b style={{ marginTop: 0 }}>{s}</b>
              <input
                inputMode="decimal"
                autoFocus={!edit}
                value={amount ? Number(amount.replace(/,/g, "")).toLocaleString("ko-KR") + (amount.endsWith(".") ? "." : "") : ""}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0"
                style={{ width: `${Math.max(1, (amount ? Number(amount).toLocaleString().length : 1)) + 0.5}ch`, border: 0, outline: 0, background: "none", fontSize: 44, fontWeight: 700, letterSpacing: "-1.5px", fontFamily: "inherit", color: "var(--ink)", textAlign: "left", padding: 0 }}
              />
            </div>
            {cur !== "KRW" && <span className="sub">≈ {Math.round(toKrw(amt, cur, trip)).toLocaleString()}원</span>}
          </div>

          <label className="flab">누가 냈나요?</label>
          <div className="payer">
            {hasShared && (
              <span className={shared ? "on" : ""} onClick={() => pickPayer("shared")}>
                <i className="team">
                  <Ic n="users" />
                </i>
                공동경비
              </span>
            )}
            {members.map((m) => (
              <span key={m.id} className={payer === m.id ? "on" : ""} onClick={() => pickPayer(m.id)}>
                <i style={{ background: m.color }}>{m.nickname.slice(0, 1)}</i>
                {m.id === me ? "나" : m.nickname}
              </span>
            ))}
          </div>

          {list.length > 0 && (
            <>
              <label className="flab">어느 포켓에서요?</label>
              <div className="pkpick">
                {list.map((p) => {
                  const st = pkStyle(p);
                  const u = pocketUse(p, others, topups);
                  return (
                    <div
                      key={p.id}
                      className={pocketId === p.id ? "on" : ""}
                      onClick={() => {
                        if (pocketId === p.id && !shared) return setPocketId("");
                        setPocketId(p.id);
                        setCur(p.currency);
                      }}
                    >
                      <span className={`pk-ic ${st.c} sm`}>
                        <Ic n={st.ic} />
                      </span>
                      <div>
                        <b>{p.name}</b>
                        <span>{u.total > 0 ? `${money(u.left, sym(p.currency))} 남음` : p.currency === "KRW" ? "원화" : p.currency}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {shared && <div className="teamnote">공동 포켓에서 빠져요 · 정산 없음</div>}

          <label className="flab">카테고리</label>
          <div className="catg six">
            {showCats.map((k) => (
              <div key={k} className={cat === k ? "on" : ""} onClick={() => setCat(k)}>
                <Ic n={expCat(k).ic as IcName} />
                <span>{k}</span>
              </div>
            ))}
          </div>

          <div className="form tight">
            <div className="inp row">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 이치란 라멘" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none" }} />
              <span className="sub">내용</span>
            </div>
            <div className="inp row" onClick={() => setDp(true)} style={{ cursor: "pointer" }}>
              <span>
                <Ic n="calendar-days" /> {day === "pre" ? "준비 · 여행 전" : `${md(day)}${time ? ` ${time}` : ""}`}
              </span>
              <span className="sub">{day === "pre" ? "" : `DAY ${no}`}</span>
            </div>
          </div>
          {days.length > 0 && (
            <div className="chips flush" style={{ marginTop: 8 }}>
              <span className={`chip${day === "pre" ? " on" : ""}`} onClick={() => setDay("pre")}>
                준비
              </span>
              {days.map((x, i) => (
                <span key={x} className={`chip${day === x ? " on" : ""}`} onClick={() => setDay(x)}>
                  DAY {i + 1}
                </span>
              ))}
            </div>
          )}

          <label className="flab">
            메모{" "}
            <span className="sub" style={{ fontWeight: 500 }}>
              선택
            </span>
          </label>
          <textarea className="mp-memo big" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예) 카드 안 돼서 현금으로 냄" rows={2} style={{ width: "100%", resize: "none", fontFamily: "inherit", display: "block" }} />

          {!shared && members.length > 1 && (
            <div className={`split${splitOn ? " on" : ""}`} id="split">
              <div className="sp-row" onClick={() => setSplitOn(!splitOn)}>
                <Ic n="users" />
                <span>나눠 내기</span>
                <i className={`sw${splitOn ? " on" : ""}`} />
              </div>
              <div className="sp-off">혼자 쓴 돈 · 정산 없음</div>
              <div className="sp-on">
                <div className="sp-lab">누구랑 나눠요?</div>
                <div className="sp-mem">
                  {members.map((m) => (
                    <span key={m.id} className={spm.includes(m.id) ? "on" : ""} onClick={() => setSpm(spm.includes(m.id) ? spm.filter((x) => x !== m.id) : [...spm, m.id])}>
                      <i style={{ background: m.color }}>{m.nickname.slice(0, 1)}</i>
                      {m.nickname}
                    </span>
                  ))}
                </div>
                <div className="segm" style={{ marginTop: 10 }}>
                  <span className={mode === "eq" ? "on" : ""} onClick={() => setMode("eq")}>
                    똑같이
                  </span>
                  <span className={mode === "own" ? "on" : ""} onClick={() => setMode("own")}>
                    직접 금액
                  </span>
                </div>
                <div className="sp-list">
                  {members
                    .filter((m) => spm.includes(m.id))
                    .map((m) => (
                      <div key={m.id} className="sp-li">
                        <i style={{ background: m.color }}>{m.nickname.slice(0, 1)}</i>
                        <b>{m.nickname}</b>
                        {mode === "eq" ? (
                          <span className="v">{money(each, s)}</span>
                        ) : (
                          <span className="v" style={{ display: "flex", alignItems: "center", gap: 2 }}>
                            {s}
                            <input inputMode="decimal" value={shares[m.id] ?? ""} onChange={(e) => setShares({ ...shares, [m.id]: e.target.value.replace(/[^\d.]/g, "") })} placeholder="0" style={{ width: 80, border: 0, borderBottom: "1.5px solid var(--line)", outline: 0, background: "none", textAlign: "right", fontWeight: 700, fontFamily: "inherit" }} />
                          </span>
                        )}
                      </div>
                    ))}
                </div>
                <div className="sp-sum">
                  {spm.length < 2 ? "나눌 사람을 두 명 이상 골라요" : mode === "eq" ? `${spm.length}명이 ${money(each, s)}씩` : ownSum === amt ? "금액이 맞아요" : `${money(amt - ownSum, s)} 남았어요`}
                </div>
              </div>
            </div>
          )}

          <label className="flab">
            영수증 사진{" "}
            <span className="sub" style={{ fontWeight: 500 }}>
              선택
            </span>
          </label>
          <div style={{ paddingBottom: 24 }}>
            <PhotoField tripId={trip.id} value={photos} onChange={setPhotos} onBusy={setUploading} max={4} />
          </div>

          {edit && (
            <div className="dellink" id="maDel" onClick={remove}>
              <Ic n="trash" /> 지출 삭제
            </div>
          )}
        </div>
      </div>
      <DatePick
        open={dp}
        onClose={() => setDp(false)}
        mode="single"
        a={day !== "pre" ? day : days[0] ?? null}
        time={time}
        withTime
        onDone={(a, _b, t) => {
          setDay(a && days.includes(a) ? a : "pre");
          setTime(t);
        }}
      />
    </section>
  );
}
