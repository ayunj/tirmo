import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip";
import { days } from "@/lib/format";
import EventForm from "@/components/EventForm";
import type { EventRow } from "@/lib/types";

export default async function EditEvent({ params }: { params: Promise<{ id: string; eventId: string }> }) {
  const { id, eventId } = await params;
  const { supabase, trip } = await loadTrip(id);
  const { data } = await supabase.from("events").select("*").eq("id", eventId).eq("trip_id", id).maybeSingle();
  if (!data) notFound();
  return <EventForm tripId={id} days={days(trip.start_date, trip.end_date)} event={data as EventRow} />;
}
