const DUR = /^(\d+\s*(시간|분|h|m)\s*)+$/i;
const FARE = /^([₩¥$€฿₫]\s?[\d,.]+|[\d,.]+\s*(원|엔))$/;

/** move_note '30분 · ¥500 · 메모' → 짧은 부분(시간·요금)과 메모 */
export function splitMove(note: string | null) {
  const out = { dur: "", fare: "", won: false, memo: [] as string[] };
  for (const p of (note ?? "").split(" · ").map((x) => x.trim()).filter(Boolean)) {
    if (!out.dur && DUR.test(p)) out.dur = p;
    else if (!out.fare && FARE.test(p)) {
      out.fare = p.replace(/[^\d.]/g, "");
      out.won = /₩|원$/.test(p);
    } else out.memo.push(p);
  }
  return { ...out, memo: out.memo.join(" · ") };
}
