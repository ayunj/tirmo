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
  const now = parseDate(today());
  const s = parseDate(start);
  const e = parseDate(end || start);
  const diff = Math.round((s.getTime() - now.getTime()) / 864e5);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-DAY";
  if (now <= e) return "여행 중";
  return "다녀옴";
}

/** 시간 글자 → 분. 11:10, 1110, 11시10분, 오후 7시 모두 읽어요. 못 읽으면 null */
export function parseTime(t: string | null | undefined): number | null {
  if (!t) return null;
  const s = t.trim();
  let h: number | null = null;
  let m = 0;
  let r = s.match(/(\d{1,2})\s*[:：.]\s*(\d{2})/);
  if (r) {
    h = +r[1];
    m = +r[2];
  } else if ((r = s.match(/(\d{1,2})\s*시\s*(?:(\d{1,2})\s*분|반)?/))) {
    h = +r[1];
    m = r[2] ? +r[2] : /반/.test(s) ? 30 : 0;
  } else if ((r = s.match(/^(\d{3,4})$/))) {
    h = +r[1].slice(0, -2);
    m = +r[1].slice(-2);
  } else if ((r = s.match(/^(\d{1,2})$/))) h = +r[1];
  if (h == null || h > 24 || m > 59) return null;
  if (/오후|저녁|밤/.test(s) && h < 12) h += 12;
  if (/오전|새벽|아침/.test(s) && h === 12) h = 0;
  return (h % 24) * 60 + m;
}

/** 시간 글자를 21:20 꼴로 (못 읽으면 그대로) */
export function normTime(t: string | null | undefined) {
  const v = parseTime(t);
  if (v == null) return t ?? "";
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}

/** 시간 글자를 정렬용 분으로 */
export function timeSort(t: string | null | undefined) {
  const v = parseTime(t);
  if (v != null) return v;
  if (!t) return 1500;
  const rough: Record<string, number> = { 새벽: 300, 아침: 480, 오전: 600, 점심: 720, 오후: 840, 저녁: 1080, 밤: 1260 };
  for (const k in rough) if (t.includes(k)) return rough[k];
  return 1500;
}

/** 일정 순서: 시간이 있으면 시간, 없으면 끼워 넣은 자리 */
export function evKey(e: { time_text: string | null; sort: number }) {
  const v = parseTime(e.time_text);
  return v != null ? v : Number(e.sort);
}
export const byEv = (a: { time_text: string | null; sort: number }, b: { time_text: string | null; sort: number }) => evKey(a) - evKey(b);

export function won(n: number) {
  return "₩" + Math.round(n).toLocaleString("ko-KR");
}

/** 한국 시간 기준 오늘 (서버가 UTC 여도) */
export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

/** 지금 시각 HH:MM (한국 시간) */
export function nowTime() {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

/** 10월 12일 */
export function mdLong(s: string) {
  const d = parseDate(s);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 통화 기호 붙이기: ¥2,400 */
export function money(n: number, sym: string) {
  const whole = !sym || /[₩¥₫]|Rp/.test(sym);
  const v = whole ? Math.round(n) : Math.round(n * 100) / 100;
  return (v < 0 ? "-" : "") + sym + Math.abs(v).toLocaleString("ko-KR");
}

type Ord = { time_text: string | null; sort: number };
/** 이 시간이면 몇 번째 자리에 들어가는지 */
export function autoAt(list: Ord[], time: string) {
  const v = parseTime(time);
  if (v == null) return list.length;
  const i = list.findIndex((e) => evKey(e) > v);
  return i < 0 ? list.length : i;
}
/** at 번째 자리에 넣을 때의 정렬값 (시간이 있으면 시간) */
export function sortAt(list: Ord[], at: number, time: string) {
  const v = parseTime(time);
  if (v != null) return v + Math.random() / 100;
  const a = list[at - 1] ? evKey(list[at - 1]) : null;
  const b = list[at] ? evKey(list[at]) : null;
  return a == null && b == null ? 1500 : a == null ? b! - 1 : b == null ? a + 1 : (a + b) / 2;
}
