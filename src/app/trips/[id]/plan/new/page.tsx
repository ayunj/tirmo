import { loadTrip } from "@/lib/trip";
import { days } from "@/lib/format";
import EventForm from "@/components/EventForm";

export default async function NewEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string }> }) {
  const { id } = await params;
  const { day } = await searchParams;
  const { trip } = await loadTrip(id);
  return <EventForm tripId={id} days={days(trip.start_date, trip.end_date)} defaultDay={day} />;
}
