import { loadTrip } from "@/lib/trip";
import BookingForm from "@/components/BookingForm";
import type { BookingKind } from "@/lib/types";

export default async function NewBooking({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kind?: string }> }) {
  const { id } = await params;
  const { kind } = await searchParams;
  const { trip, members, user } = await loadTrip(id);
  return <BookingForm tripId={id} tripCurrency={trip.currency} memberIds={members.map((m) => m.user_id)} me={user.id} defaultKind={kind as BookingKind} />;
}
