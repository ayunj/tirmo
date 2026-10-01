import { loadTrip } from "@/lib/trip";
import { linkOptions } from "@/lib/links";

export async function packFormData(id: string) {
  const { supabase, members } = await loadTrip(id);
  const [{ data }, opts] = await Promise.all([supabase.from("pack_items").select("category").eq("trip_id", id), linkOptions(supabase, id)]);
  return {
    supabase,
    cats: Array.from(new Set((data ?? []).map((d) => d.category as string))),
    members: members.map((m) => ({ id: m.user_id, nickname: m.profiles?.nickname || "?", color: m.profiles?.color || "#8B95A1" })),
    bookings: opts.bookings,
  };
}
