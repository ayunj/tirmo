import { loadTrip } from "@/lib/trip";
import { days } from "@/lib/format";
import BookingForm from "@/components/BookingForm";
import type { BookingKind, Pocket } from "@/lib/types";

export default async function NewBooking({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kind?: string }> }) {
  const { id } = await params;
  const { kind } = await searchParams;
  const { supabase, trip, members, user } = await loadTrip(id);
  const { data } = await supabase.from("pockets").select("*").eq("trip_id", id).order("created_at");
  return <BookingForm tripId={id} tripCurrency={trip.currency} memberIds={members.map((m) => m.user_id)} me={user.id} pockets={(data ?? []) as Pocket[]} days={days(trip.start_date, trip.end_date)} defaultKind={kind as BookingKind} />;
}
