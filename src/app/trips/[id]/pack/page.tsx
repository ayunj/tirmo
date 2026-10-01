import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { loadTrip } from "@/lib/trip";
import { dday } from "@/lib/format";
import { PACK_CATS } from "@/lib/pack";
import LiveRefresh from "@/components/LiveRefresh";
import PackList from "@/components/PackList";
import type { PackItem } from "@/lib/types";

export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, trip, members } = await loadTrip(id);
  const { data } = await supabase.from("pack_items").select("*").eq("trip_id", id).order("sort").order("created_at");
  const items = (data ?? []) as PackItem[];
  const used = Array.from(new Set(items.map((i) => i.category)));
  const cats = [...PACK_CATS.filter((c) => used.includes(c)), ...used.filter((c) => !PACK_CATS.includes(c))];
  const who = Object.fromEntries(members.map((m) => [m.user_id, { nickname: m.profiles?.nickname || "?", color: m.profiles?.color || "#8B95A1" }]));
  const dd = dday(trip.start_date, trip.end_date);
  const dleft = dd.startsWith("D-") && dd !== "D-DAY" ? `출발까지 ${dd.slice(2)}일` : dd === "D-DAY" ? "오늘 출발" : "";

  return (
    <main>
      <LiveRefresh tripId={id} table="pack_items" />
      <header className="hd">
        <Link href={`/trips/${id}/more`} className="ib -ml-2" aria-label="뒤로">
          <ChevronLeft size={24} />
        </Link>
        <h1>준비물</h1>
        <Link href={`/trips/${id}/pack/new`} className="ib" aria-label="준비물 추가">
          <Plus size={22} />
        </Link>
      </header>
      <PackList tripId={id} items={items} cats={cats} who={who} dleft={dleft} />
    </main>
  );
}
