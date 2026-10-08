import { loadTrip } from "@/lib/trip";
import { visibleMoney } from "@/lib/money";
import type { Expense, Pocket, Topup, Transfer } from "@/lib/types";

export async function loadMoney(id: string) {
  const t = await loadTrip(id);
  const [p, e, tr, tu] = await Promise.all([
    t.supabase.from("pockets").select("*").eq("trip_id", id).order("shared").order("created_at"),
    t.supabase.from("expenses").select("*").eq("trip_id", id).order("day", { nullsFirst: true }).order("time_text", { nullsFirst: true }).order("created_at"),
    t.supabase.from("transfers").select("*").eq("trip_id", id).order("created_at"),
    t.supabase.from("topups").select("*").eq("trip_id", id).order("created_at"),
  ]);
  const people = t.members.map((m) => ({ id: m.user_id, nickname: m.profiles?.nickname || "?", color: m.profiles?.color || "#8B95A1" }));
  const all = (e.data ?? []) as Expense[];
  const vis = visibleMoney((p.data ?? []) as Pocket[], all, t.user.id);
  return { ...t, pockets: vis.pockets, expenses: vis.expenses, allExpenses: all, transfers: (tr.data ?? []) as Transfer[], topups: (tu.data ?? []) as Topup[], people };
}
