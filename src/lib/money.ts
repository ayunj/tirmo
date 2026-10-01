import { CURRENCIES } from "@/lib/places";
export { money } from "@/lib/format";
import type { Expense, Member, Pocket, Topup, Transfer, Trip } from "@/lib/types";

export const EXP_CATS = [
  { key: "식비", color: "#C98718", ec: "amber", ic: "utensils" },
  { key: "카페", color: "#E0584C", ec: "acc", ic: "coffee" },
  { key: "교통", color: "#3A6DE0", ec: "blue", ic: "train-front" },
  { key: "쇼핑", color: "#6A4FD6", ec: "violet", ic: "shopping-bag" },
  { key: "숙소", color: "#8A6FD6", ec: "violet", ic: "bed-double" },
  { key: "기타", color: "#2E8C66", ec: "green", ic: "ellipsis" },
] as const;
const LEGACY: Record<string, { color: string; ec: string; ic: string }> = { 항공: { color: "#3A6DE0", ec: "blue", ic: "plane" }, 관광: { color: "#2E8C66", ec: "green", ic: "ticket" }, 정산: { color: "#3A6DE0", ec: "blue", ic: "arrow-left-right" } };
export const expCat = (k: string) => EXP_CATS.find((x) => x.key === k) ?? { key: k, ...(LEGACY[k] ?? LEGACY.관광) };
export const expColor = (c: string) => expCat(c).color;

export const POCKET_KINDS = [
  { key: "cash", label: "현금" },
  { key: "card", label: "카드" },
  { key: "bank", label: "통장" },
] as const;

export const sym = (code: string) => CURRENCIES[code]?.sym ?? code + " ";

/** 원화로 바꾸기 */
export function toKrw(amount: number, currency: string, trip: Pick<Trip, "currency" | "rate" | "rate_unit">) {
  if (currency === "KRW") return amount;
  if (currency === trip.currency) return (amount * Number(trip.rate)) / (trip.rate_unit || 1);
  const c = CURRENCIES[currency];
  return c ? (amount * c.rate) / c.unit : amount;
}

/** 포켓에서 쓴 돈 · 남은 돈 */
export function pocketUse(p: Pocket, list: Expense[], tops: Topup[] = []) {
  const used = list.filter((e) => e.pocket_id === p.id && e.currency === p.currency).reduce((s, e) => s + Number(e.amount), 0);
  const added = tops.filter((t) => t.pocket_id === p.id).reduce((s, t) => s + Number(t.amount), 0);
  const total = Number(p.budget) + added;
  return { used, added, total, left: total - used, pct: total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0 };
}

/**
 * 정산: 개인이 낸 돈 중 '나눠 내기'로 한 것만.
 * 결과: 각자 낸 돈, 각자 몫, 누가 누구에게 얼마.
 */
export function settle(trip: Pick<Trip, "currency" | "rate" | "rate_unit">, members: Member[], list: Expense[], transfers: Transfer[]) {
  const ids = members.map((m) => m.user_id);
  const paid: Record<string, number> = Object.fromEntries(ids.map((i) => [i, 0]));
  const owe: Record<string, number> = Object.fromEntries(ids.map((i) => [i, 0]));
  let total = 0;
  for (const e of list) {
    if (!e.payer_id || !e.split?.members?.length) continue;
    const who = e.split.members.filter((m) => ids.includes(m));
    if (!who.length || !(e.payer_id in paid)) continue;
    const krw = toKrw(Number(e.amount), e.currency, trip);
    total += krw;
    paid[e.payer_id] += krw;
    if (e.split.mode === "own" && e.split.shares) {
      const k = krw / (Number(e.amount) || 1);
      for (const m of who) owe[m] += (Number(e.split.shares[m]) || 0) * k;
    } else for (const m of who) owe[m] += krw / who.length;
  }
  // 받을 돈(+) / 보낼 돈(-)
  const bal: Record<string, number> = Object.fromEntries(ids.map((i) => [i, paid[i] - owe[i]]));
  for (const t of transfers) {
    if (t.from_id in bal) bal[t.from_id] += Number(t.amount);
    if (t.to_id in bal) bal[t.to_id] -= Number(t.amount);
  }
  const plus = ids.filter((i) => bal[i] > 0.5).map((i) => ({ id: i, v: bal[i] })).sort((a, b) => b.v - a.v);
  const minus = ids.filter((i) => bal[i] < -0.5).map((i) => ({ id: i, v: -bal[i] })).sort((a, b) => b.v - a.v);
  const moves: { from: string; to: string; amount: number }[] = [];
  let a = 0;
  let b = 0;
  while (a < minus.length && b < plus.length) {
    const v = Math.min(minus[a].v, plus[b].v);
    if (v >= 1) moves.push({ from: minus[a].id, to: plus[b].id, amount: Math.round(v) });
    minus[a].v -= v;
    plus[b].v -= v;
    if (minus[a].v < 0.5) a++;
    if (plus[b].v < 0.5) b++;
  }
  return { total, paid, owe, moves };
}

/** 포켓 아이콘 · 색 (목업) */
const PK: Record<string, { ic: "banknote" | "credit-card" | "landmark"; c: string; color: string }> = {
  cash: { ic: "banknote", c: "amber", color: "var(--amber)" },
  card: { ic: "credit-card", c: "violet", color: "var(--violet)" },
  bank: { ic: "landmark", c: "green", color: "var(--green)" },
};
export const pkStyle = (p: Pick<Pocket, "kind" | "shared">) => (p.shared ? { ...PK[p.kind], c: "acc", color: "var(--acc)" } : PK[p.kind]);
