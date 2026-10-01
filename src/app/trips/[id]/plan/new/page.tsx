import { loadTrip } from "@/lib/trip";
import { days } from "@/lib/format";
import { linkOptions } from "@/lib/links";
import EventForm from "@/components/EventForm";

export default async function NewEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string; wish?: string }> }) {
  const { id } = await params;
  const { day, wish } = await searchParams;
  const { supabase, trip } = await loadTrip(id);
  const opts = await linkOptions(supabase, id);
  return <EventForm tripId={id} days={days(trip.start_date, trip.end_date)} defaultDay={day ?? (wish ? "none" : undefined)} defaultWish={wish} {...opts} />;
}
