import { loadTrip } from "@/lib/trip";
import { recentPlaces } from "@/lib/recent";
import TripForm from "@/components/TripForm";

export default async function EditTrip({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, trip, members } = await loadTrip(id);
  const recent = await recentPlaces(supabase, id);
  return <TripForm trip={trip} members={members.map((m) => ({ nickname: m.profiles?.nickname || "?", color: m.profiles?.color || "#8B95A1" }))} {...recent} />;
}
