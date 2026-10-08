import { loadTrip } from "@/lib/trip";
import { days } from "@/lib/format";
import LiveRefresh from "@/components/LiveRefresh";
import WishScreen from "@/components/WishScreen";
import type { Wish } from "@/lib/types";

export default async function WishPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab } = await searchParams;
  const { supabase, trip, user, members } = await loadTrip(id);
  const [w, ev] = await Promise.all([
    supabase.from("wishes").select("*").eq("trip_id", id).order("created_at"),
    supabase.from("events").select("id, day, time_text, sort, title, wish_id").eq("trip_id", id).order("sort"),
  ]);
  const events = ev.data ?? [];
  const planned: Record<string, string | null> = {};
  for (const e of events) if (e.wish_id && !(e.wish_id in planned)) planned[e.wish_id] = e.day;
  return (
    <>
      <LiveRefresh tripId={id} table="wishes" />
      <WishScreen tripId={id} head={trip} tab={tab === "shop" ? "shop" : "place"} wishes={((w.data ?? []) as Wish[]).filter((x) => x.created_by === user.id || x.shared !== false)} me={user.id} together={members.length > 1} days={days(trip.start_date, trip.end_date)} events={events} planned={planned} />
    </>
  );
}
