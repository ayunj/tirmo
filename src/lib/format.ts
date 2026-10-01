const WK = ["일", "월", "화", "수", "목", "금", "토"];

export function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function iso(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 10.10 (토) */
export function md(s: string | null) {
  if (!s) return "";
  const d = parseDate(s);
  return `${d.getMonth() + 1}.${d.getDate()} (${WK[d.getDay()]})`;
}

export function weekday(s: string) {
  return WK[parseDate(s).getDay()];
}

/** 10.10 (토) – 10.12 (월) · 2박 3일 */
export function range(start: string | null, end: string | null) {
  if (!start) return "날짜 미정";
  if (!end || end === start) return `${md(start)} · 당일`;
  const n = Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / 864e5);
  return `${md(start)} – ${md(end)} · ${n}박 ${n + 1}일`;
}

/** 여행 날짜들 */
export function days(start: string | null, end: string | null) {
  if (!start) return [] as string[];
  const out: string[] = [];
  const e = parseDate(end || start);
  for (let d = parseDate(start); d <= e; d.setDate(d.getDate() + 1)) out.push(iso(new Date(d)));
  return out;
}

/** D-10, D-DAY, 여행 중, 다녀옴 */
export function dday(start: string | null, end: string | null) {
  if (!start) return "";
  const today = parseDate(iso(new Date()));
  const s = parseDate(start);
  const e = parseDate(end || start);
  const diff = Math.round((s.getTime() - today.getTime()) / 864e5);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-DAY";
  if (today <= e) return "여행 중";
  return "다녀옴";
}

/** 시간 글자를 정렬용 분으로 */
export function timeSort(t: string | null | undefined) {
  if (!t) return 1500;
  const m = t.match(/(\d{1,2}):(\d{2})/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const rough: Record<string, number> = { 새벽: 300, 아침: 480, 오전: 600, 점심: 720, 오후: 840, 저녁: 1080, 밤: 1260 };
  for (const k in rough) if (t.includes(k)) return rough[k];
  return 1500;
}

export function won(n: number) {
  return "₩" + Math.round(n).toLocaleString("ko-KR");
}
