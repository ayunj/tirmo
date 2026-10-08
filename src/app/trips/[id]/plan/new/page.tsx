import { loadTrip } from "@/lib/trip";
import { days } from "@/lib/format";
import { linkOptions } from "@/lib/links";
import EventForm from "@/components/EventForm";

export default async function NewEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string; wish?: string }> }) {
  const { id } = await params;
  const { day, wish } = await searchParams;
  const { supabase, trip, user } = await loadTrip(id);
  const [opts, ev] = await Promise.all([linkOptions(supabase, id, user.id), supabase.from("events").select("id, day, time_text, sort, title").eq("trip_id", id).order("sort")]);
  return <EventForm tripId={id} days={days(trip.start_date, trip.end_date)} dayEvents={ev.data ?? []} defaultDay={day ?? (wish ? "none" : undefined)} defaultWish={wish} {...opts} />;
}
