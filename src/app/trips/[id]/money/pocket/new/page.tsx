import { loadTrip } from "@/lib/trip";
import PocketForm from "@/components/PocketForm";

export default async function NewPocket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trip, user, members } = await loadTrip(id);
  return <PocketForm trip={trip} me={user.id} members={members.map((m) => ({ id: m.user_id, nickname: m.profiles?.nickname || "?" }))} />;
}
