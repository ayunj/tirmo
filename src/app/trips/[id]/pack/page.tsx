import { loadTrip } from "@/lib/trip";
import { dday } from "@/lib/format";
import LiveRefresh from "@/components/LiveRefresh";
import PackScreen from "@/components/PackScreen";
import type { PackItem } from "@/lib/types";

export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, trip, members, user } = await loadTrip(id);
  const [{ data }, other] = await Promise.all([
    supabase.from("pack_items").select("*").eq("trip_id", id).or(`assignee.eq.${user.id},assignee.is.null`).order("sort").order("created_at"),
    supabase.from("trips").select("id, title, start_date, pack_items(name, category, assignee)").neq("id", id).order("start_date", { ascending: false, nullsFirst: false }).limit(10),
  ]);
  // 지난 여행에서도 내 것(과 다 같이 챙긴 것)만 불러와요
  type PI = { name: string; category: string; assignee: string | null };
  const mineOf = (t: { pack_items: unknown }) => (t.pack_items as PI[]).filter((i) => !i.assignee || i.assignee === user.id).map(({ name, category }) => ({ name, category }));
  const prevTrip = (other.data ?? []).find((t) => mineOf(t).length > 0);
  const prev = prevTrip ? { title: prevTrip.title as string, items: mineOf(prevTrip) } : null;
  const dd = dday(trip.start_date, trip.end_date);
  const dleft = dd.startsWith("D-") && dd !== "D-DAY" ? `출발까지 ${dd.slice(2)}일` : dd === "D-DAY" ? "오늘 출발" : "";
  const people = members.map((m) => ({ id: m.user_id, nickname: m.profiles?.nickname || "?", color: m.profiles?.color || "#8B95A1" }));
  return (
    <>
      <LiveRefresh tripId={id} table="pack_items" />
      <PackScreen tripId={id} head={trip} items={(data ?? []) as PackItem[]} members={people} me={user.id} dleft={dleft} prev={prev} />
    </>
  );
}
