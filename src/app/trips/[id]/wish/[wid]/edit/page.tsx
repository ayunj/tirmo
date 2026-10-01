import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip";
import WishForm from "@/components/WishForm";
import type { Wish } from "@/lib/types";

export default async function EditWish({ params }: { params: Promise<{ id: string; wid: string }> }) {
  const { id, wid } = await params;
  const { supabase } = await loadTrip(id);
  const [{ data }, g] = await Promise.all([
    supabase.from("wishes").select("*").eq("id", wid).eq("trip_id", id).maybeSingle(),
    supabase.from("wishes").select("shop_group").eq("trip_id", id).eq("kind", "shop"),
  ]);
  if (!data) notFound();
  const groups = Array.from(new Set((g.data ?? []).map((d) => d.shop_group as string).filter(Boolean)));
  return <WishForm tripId={id} wish={data as Wish} groups={groups} />;
}
