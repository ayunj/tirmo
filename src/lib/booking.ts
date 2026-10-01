import type { Booking, BookingKind } from "@/lib/types";

export type BField = { key: string; label: string; ph?: string; type?: "date" | "time" | "text" | "tel"; half?: boolean };

export const BOOKING_KINDS: { key: BookingKind; label: string; short: string }[] = [
  { key: "flight", label: "항공권", short: "항공" },
  { key: "hotel", label: "숙소", short: "숙소" },
  { key: "car", label: "렌터카", short: "렌터카" },
  { key: "restaurant", label: "식당", short: "식당" },
  { key: "tour", label: "투어·입장권", short: "투어" },
  { key: "etc", label: "기타", short: "기타" },
];

export const kindLabel = (k: string) => BOOKING_KINDS.find((x) => x.key === k)?.label ?? "예약";

export const BOOKING_FIELDS: Record<BookingKind, BField[]> = {
  flight: [
    { key: "airline", label: "항공사", ph: "제주항공", half: true },
    { key: "flight_no", label: "편명", ph: "7C1471", half: true },
    { key: "from", label: "출발", ph: "인천 T1", half: true },
    { key: "from_time", label: "시간", ph: "11:10", type: "time", half: true },
    { key: "to", label: "도착", ph: "후쿠오카", half: true },
    { key: "to_time", label: "시간", ph: "12:40", type: "time", half: true },
    { key: "date", label: "날짜", type: "date" },
    { key: "pnr", label: "예약번호", ph: "JR8K2Q" },
    { key: "pax", label: "탑승객", ph: "3명", half: true },
    { key: "seat", label: "좌석", ph: "14A · B · C", half: true },
    { key: "boarding", label: "탑승 시작", ph: "10:40", type: "time", half: true },
    { key: "bag", label: "수하물", ph: "15kg", half: true },
  ],
  hotel: [
    { key: "checkin", label: "체크인", type: "date", half: true },
    { key: "checkin_time", label: "시간", ph: "15:00", type: "time", half: true },
    { key: "checkout", label: "체크아웃", type: "date", half: true },
    { key: "checkout_time", label: "시간", ph: "11:00", type: "time", half: true },
    { key: "pnr", label: "예약번호", ph: "BW-48213" },
    { key: "room", label: "객실", ph: "트윈 + 엑스트라 베드 · 3명" },
    { key: "address", label: "주소", ph: "3-8-3 Watanabedori, Chuo Ward" },
    { key: "phone", label: "전화", ph: "+81 92-000-0000", type: "tel" },
  ],
  car: [
    { key: "company", label: "렌터카 회사", ph: "토요타 렌터카" },
    { key: "pickup", label: "빌리는 곳", ph: "후쿠오카 공항점" },
    { key: "pickup_date", label: "날짜", type: "date", half: true },
    { key: "pickup_time", label: "시간", type: "time", half: true },
    { key: "dropoff", label: "반납하는 곳", ph: "하카타역점" },
    { key: "dropoff_date", label: "날짜", type: "date", half: true },
    { key: "dropoff_time", label: "시간", type: "time", half: true },
    { key: "pnr", label: "예약번호" },
    { key: "phone", label: "전화", type: "tel" },
  ],
  restaurant: [
    { key: "date", label: "날짜", type: "date", half: true },
    { key: "time", label: "시간", type: "time", half: true },
    { key: "pax", label: "인원", ph: "3명", half: true },
    { key: "pnr", label: "예약번호", half: true },
    { key: "open_at", label: "예약 열리는 때", ph: "9/10 (수) 10:00" },
    { key: "address", label: "주소" },
    { key: "phone", label: "전화", type: "tel" },
  ],
  tour: [
    { key: "date", label: "날짜", type: "date", half: true },
    { key: "time", label: "시간", type: "time", half: true },
    { key: "pax", label: "인원", ph: "3명", half: true },
    { key: "pnr", label: "예약번호", half: true },
    { key: "address", label: "모이는 곳 · 주소" },
  ],
  etc: [
    { key: "date", label: "날짜", type: "date", half: true },
    { key: "time", label: "시간", type: "time", half: true },
    { key: "pnr", label: "예약번호" },
    { key: "address", label: "주소" },
  ],
};

export const STATUSES = ["예약 완료", "결제 대기", "예약 오픈 대기", "현장 줄서기"];

/** 이 예약이 언제인지 (정렬 · 일정 넣기용) */
export function when(b: Pick<Booking, "kind" | "details">): { date: string | null; time: string | null } {
  const d = b.details || {};
  switch (b.kind) {
    case "flight":
      return { date: d.date || null, time: d.from_time || null };
    case "hotel":
      return { date: d.checkin || null, time: d.checkin_time || null };
    case "car":
      return { date: d.pickup_date || null, time: d.pickup_time || null };
    default:
      return { date: d.date || null, time: d.time || null };
  }
}

export function sortKey(b: Pick<Booking, "kind" | "details">) {
  const w = when(b);
  return w.date ? `${w.date} ${w.time || "99:99"}` : null;
}

/** 항공권 제목: 인천 T1 → 후쿠오카 */
export function bookingTitle(b: Pick<Booking, "kind" | "details" | "title">) {
  if (b.kind === "flight") {
    const d = b.details || {};
    if (d.from || d.to) return `${d.from || "?"} → ${d.to || "?"}`;
  }
  return b.title;
}

/** 두 시각 사이 (같은 시간대라고 보고) 1h 30m */
export function between(a?: string, b?: string) {
  const m1 = a?.match(/^(\d{1,2}):(\d{2})/);
  const m2 = b?.match(/^(\d{1,2}):(\d{2})/);
  if (!m1 || !m2) return "";
  let diff = Number(m2[1]) * 60 + Number(m2[2]) - (Number(m1[1]) * 60 + Number(m1[2]));
  if (diff < 0) diff += 1440;
  return `${Math.floor(diff / 60)}h ${String(diff % 60).padStart(2, "0")}m`;
}

/** 숙소 몇 박 */
export function nights(a?: string, b?: string) {
  if (!a || !b) return 0;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 864e5);
}
