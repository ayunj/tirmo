import { loadTrip } from "@/lib/trip";
import { days } from "@/lib/format";

export async function entryFormData(id: string) {
  const t = await loadTrip(id);
  const { data } = await t.supabase.from("events").select("id, day, title").eq("trip_id", id).order("sort");
  return { ...t, days: days(t.trip.start_date, t.trip.end_date), events: (data ?? []) as { id: string; day: string | null; title: string }[] };
}
