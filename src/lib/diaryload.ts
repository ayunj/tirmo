import { loadTrip } from "@/lib/trip";
import { days } from "@/lib/format";
import type { Pocket } from "@/lib/types";

export async function entryFormData(id: string) {
  const t = await loadTrip(id);
  const [{ data }, p] = await Promise.all([t.supabase.from("events").select("id, day, title").eq("trip_id", id).order("sort"), t.supabase.from("pockets").select("*").eq("trip_id", id).order("shared", { ascending: false })]);
  return { ...t, days: days(t.trip.start_date, t.trip.end_date), events: (data ?? []) as { id: string; day: string | null; title: string }[], pockets: (p.data ?? []) as Pocket[] };
}
