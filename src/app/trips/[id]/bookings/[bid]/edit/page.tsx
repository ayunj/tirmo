import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip";
import { days } from "@/lib/format";
import BookingForm from "@/components/BookingForm";
import type { Booking } from "@/lib/types";

export default async function EditBooking({ params }: { params: Promise<{ id: string; bid: string }> }) {
  const { id, bid } = await params;
  const { supabase, trip, members, user } = await loadTrip(id);
  const { data } = await supabase.from("bookings").select("*").eq("id", bid).eq("trip_id", id).maybeSingle();
  if (!data) notFound();
  return <BookingForm tripId={id} tripCurrency={trip.currency} memberIds={members.map((m) => m.user_id)} me={user.id} pockets={[]} days={days(trip.start_date, trip.end_date)} booking={data as Booking} />;
}
