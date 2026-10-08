import type { SupabaseClient } from "@supabase/supabase-js";
import { bookingTitle, when } from "@/lib/booking";
import type { IcName } from "@/components/Ic";
import type { Booking } from "@/lib/types";
import { wishKind } from "@/lib/wish";

const BK_IC: Record<string, [IcName, string, string]> = {
  flight: ["plane", "blue", "교통"],
  hotel: ["bed-double", "violet", "숙소"],
  car: ["car", "amber", "교통"],
  restaurant: ["utensils", "acc", "음식점"],
  tour: ["ticket", "green", "체험"],
  etc: ["ellipsis", "blue", "기타"],
};
const md = (s: string) => `${+s.split("-")[1]}/${+s.split("-")[2]}`;

/** 일정에 연결 · 추천할 예약 · 가고싶은곳 · 자주 가는 곳 */
export async function linkOptions(supabase: SupabaseClient, tripId: string, me?: string) {
  const [b, w, e] = await Promise.all([
    supabase.from("bookings").select("id, kind, title, details, status").eq("trip_id", tripId).order("sort_key", { nullsFirst: false }),
    supabase.from("wishes").select("*").eq("trip_id", tripId).order("created_at"),
    supabase.from("events").select("title, category, address").eq("trip_id", tripId),
  ]);
  const bookings = ((b.data ?? []) as (Pick<Booking, "id" | "kind" | "title" | "details" | "status">)[]).map((x) => {
    const w2 = when(x);
    const [ic, c, cat] = BK_IC[x.kind] ?? BK_IC.etc;
    return { id: x.id, title: bookingTitle(x), sub: [w2.date ? `${md(w2.date)}${w2.time ? ` ${w2.time}` : ""}` : "", x.status].filter(Boolean).join(" · "), ic, c, cat, address: x.details?.address ?? null, kind: x.kind, status: x.status ?? undefined };
  });
  const wishes = (w.data ?? [])
    .filter((x) => !me || x.created_by === me || x.shared !== false)
    .map((x) =>
      x.kind === "shop"
        ? { id: x.id as string, wk: "shop" as const, st: (x.status as string | null) ?? null, title: x.name as string, cat: "쇼핑", address: null, link: null, sub: [x.shop_group || "미지정", x.memo?.split("\n")[0]].filter(Boolean).join(" · "), ic: "shopping-bag" as IcName, c: "green" }
        : { id: x.id as string, wk: "place" as const, title: x.name as string, cat: wishKind(x.category as string)?.[2] ?? "기타", address: x.address as string | null, link: x.link as string | null, sub: [x.category, x.address].filter(Boolean).join(" · ") },
    );
  // 자주 가는 곳: 숙소 + 이 여행에서 두 번 이상 쓴 이름
  const cnt = new Map<string, { n: number; cat: string; address: string | null }>();
  for (const r of e.data ?? []) {
    const k = r.title as string;
    const v = cnt.get(k) ?? { n: 0, cat: r.category as string, address: r.address as string | null };
    v.n++;
    cnt.set(k, v);
  }
  const frequent = [
    ...bookings.filter((x) => x.kind === "hotel").map((x) => ({ id: x.id, title: x.title, cat: "숙소", address: x.address })),
    ...[...cnt.entries()].filter(([, v]) => v.n > 1).map(([k, v]) => ({ id: `e-${k}`, title: k, cat: v.cat, address: v.address })),
  ];
  return { bookings, wishes, frequent };
}
