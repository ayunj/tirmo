import type { SupabaseClient } from "@supabase/supabase-js";
import { bookingTitle } from "@/lib/booking";
import type { Booking } from "@/lib/types";

/** 일정에 연결할 수 있는 예약 · 가고싶은곳 */
export async function linkOptions(supabase: SupabaseClient, tripId: string) {
  const [b, w] = await Promise.all([
    supabase.from("bookings").select("id, kind, title, details").eq("trip_id", tripId).order("sort_key", { nullsFirst: false }),
    supabase.from("wishes").select("id, name, address, link").eq("trip_id", tripId).eq("kind", "place").order("created_at"),
  ]);
  return {
    bookings: ((b.data ?? []) as Pick<Booking, "id" | "kind" | "title" | "details">[]).map((x) => ({ id: x.id, title: bookingTitle(x) })),
    wishes: (w.data ?? []).map((x) => ({ id: x.id as string, title: x.name as string, address: x.address as string | null, link: x.link as string | null })),
  };
}
