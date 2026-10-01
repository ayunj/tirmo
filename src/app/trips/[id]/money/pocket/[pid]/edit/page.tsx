import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip";
import PocketForm from "@/components/PocketForm";
import type { Pocket } from "@/lib/types";

export default async function EditPocket({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  const { supabase, trip, user, members } = await loadTrip(id);
  const { data } = await supabase.from("pockets").select("*").eq("id", pid).eq("trip_id", id).maybeSingle();
  if (!data) notFound();
  return <PocketForm trip={trip} me={user.id} members={members.map((m) => ({ id: m.user_id, nickname: m.profiles?.nickname || "?" }))} pocket={data as Pocket} />;
}
