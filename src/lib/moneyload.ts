import { loadTrip } from "@/lib/trip";
import type { Expense, Pocket, Transfer } from "@/lib/types";

export async function loadMoney(id: string) {
  const t = await loadTrip(id);
  const [p, e, tr] = await Promise.all([
    t.supabase.from("pockets").select("*").eq("trip_id", id).order("shared").order("created_at"),
    t.supabase.from("expenses").select("*").eq("trip_id", id).order("day", { nullsFirst: true }).order("time_text", { nullsFirst: true }).order("created_at"),
    t.supabase.from("transfers").select("*").eq("trip_id", id).order("created_at"),
  ]);
  const people = t.members.map((m) => ({ id: m.user_id, nickname: m.profiles?.nickname || "?", color: m.profiles?.color || "#8B95A1" }));
  return { ...t, pockets: (p.data ?? []) as Pocket[], expenses: (e.data ?? []) as Expense[], transfers: (tr.data ?? []) as Transfer[], people };
}
