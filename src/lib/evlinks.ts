/** 일정에 연결한 예약 · 위시 (여러 개). 예전 한 개짜리 칸도 같이 봐요 */
export function evLinks(e: { booking_id: string | null; wish_id: string | null; booking_ids?: string[] | null; wish_ids?: string[] | null }) {
  const u = (a: (string | null | undefined)[]) => Array.from(new Set(a.filter(Boolean) as string[]));
  return { bks: u([...(e.booking_ids ?? []), e.booking_id]), wis: u([...(e.wish_ids ?? []), e.wish_id]) };
}
