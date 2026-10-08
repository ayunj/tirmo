// 이동 시간: '30분', '1시간 30분', '약 20분', '20분 정도', '1:30', '1h 20m' 처럼 숫자 + 시간 단위가 있는 짧은 말
const DUR_RE = /^(약\s*)?\d[\d\s~\-–.시간분hrmin]*(시간|분|h|hr|min|m)\s*(정도|쯤|내외)?$/i;
const isDur = (p: string) => p.length <= 20 && (DUR_RE.test(p) || /^\d{1,2}:\d{2}$/.test(p));

/** 숫자만 적으면 분, 1:30 은 1시간 30분 */
export function normDur(v: string) {
  const t = v.trim();
  if (/^\d+$/.test(t)) return `${t}분`;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return [+m[1] ? `${+m[1]}시간` : "", +m[2] ? `${+m[2]}분` : ""].filter(Boolean).join(" ") || t;
  return t;
}
const FARE = /^([₩¥$€฿₫]\s?[\d,.]+|[\d,.]+\s*(원|엔))$/;

/** move_note '30분 · ¥500 · 메모' → 짧은 부분(시간·요금)과 메모 */
export function splitMove(note: string | null) {
  const out = { dur: "", fare: "", won: false, memo: [] as string[] };
  for (const p of (note ?? "").split(" · ").map((x) => x.trim()).filter(Boolean)) {
    if (!out.dur && isDur(p)) out.dur = p;
    else if (!out.fare && FARE.test(p)) {
      out.fare = p.replace(/[^\d.]/g, "");
      out.won = /₩|원$/.test(p);
    } else out.memo.push(p);
  }
  return { ...out, memo: out.memo.join(" · ") };
}
