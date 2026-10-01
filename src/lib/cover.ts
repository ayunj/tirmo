import type { Trip } from "@/lib/types";

/** 목업 커버 색 (위 · 아래 두 색) */
export const COVERS: [string, string][] = [
  ["#7BBCFF", "#3B8EF0"],
  ["#5E626B", "#44474F"],
  ["#F5BE4E", "#E0960E"],
  ["#34496E", "#223252"],
  ["#E0A3A0", "#C77E7B"],
  ["#5A9277", "#2F6B52"],
  ["#9A8BC4", "#7565A6"],
  ["#4F8FAE", "#346F8C"],
];

export function coverPair(c: string | null | undefined): [string, string] {
  const k = (c || "").toLowerCase();
  if (!k || k === "#4da3ff") return COVERS[0];
  return COVERS.find((p) => p[0].toLowerCase() === k || p[1].toLowerCase() === k) ?? [c!, c!];
}

export function cv(trip: Pick<Trip, "cover_color">) {
  const [a, b] = coverPair(trip.cover_color);
  return { "--cv1": a, "--cv2": b } as React.CSSProperties;
}

export function ct(color: string | null | undefined) {
  const [a, b] = coverPair(color);
  return { "--c1": a, "--c2": b } as React.CSSProperties;
}

const p2 = (n: number) => String(n).padStart(2, "0");

/** 2026. 10. 10 — 10. 12 */
export function coverDate(s: string | null, e: string | null) {
  if (!s) return "날짜 미정";
  const [y, m, d] = s.split("-");
  const a = `${y}. ${+m}. ${+d}`;
  if (!e || e === s) return a;
  const [y2, m2, d2] = e.split("-");
  return y2 === y ? `${a} — ${+m2}. ${+d2}` : `${a} — ${y2}. ${+m2}. ${+d2}`;
}

/** 07.25 – 07.28 */
export function shortRange(s: string | null, e: string | null) {
  if (!s) return "날짜 미정";
  const f = (x: string) => `${p2(+x.split("-")[1])}.${p2(+x.split("-")[2])}`;
  return !e || e === s ? f(s) : `${f(s)} – ${f(e)}`;
}
