import { loadTrip } from "@/lib/trip";
import TripForm from "@/components/TripForm";

export default async function EditTrip({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trip } = await loadTrip(id);
  return <TripForm trip={trip} />;
}
