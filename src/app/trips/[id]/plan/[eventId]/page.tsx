import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip";
import { days } from "@/lib/format";
import { linkOptions } from "@/lib/links";
import EventDetail from "@/components/EventDetail";
import type { EventRow } from "@/lib/types";

export default async function EventPage({ params, searchParams }: { params: Promise<{ id: string; eventId: string }>; searchParams: Promise<{ day?: string }> }) {
  const { id, eventId } = await params;
  const { day } = await searchParams;
  const { supabase, trip, user } = await loadTrip(id);
  const ds = days(trip.start_date, trip.end_date);
  const [{ data }, opts, rec] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).eq("trip_id", id).maybeSingle(),
    linkOptions(supabase, id),
    supabase.from("entries").select("id, title, body, photos, day, time_text").eq("event_id", eventId).eq("created_by", user.id).order("created_at"),
  ]);
  if (!data) notFound();
  const ev = data as EventRow;
  return <EventDetail ev={ev} days={ds} bookings={opts.bookings} wishes={opts.wishes} records={rec.data ?? []} putDay={day && ds.includes(day) && !ev.day ? day : undefined} />;
}
