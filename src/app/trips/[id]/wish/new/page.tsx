import { loadTrip } from "@/lib/trip";
import WishForm from "@/components/WishForm";

export default async function NewWish({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kind?: string }> }) {
  const { id } = await params;
  const { kind } = await searchParams;
  const { supabase } = await loadTrip(id);
  const { data } = await supabase.from("wishes").select("shop_group").eq("trip_id", id).eq("kind", "shop");
  const groups = Array.from(new Set((data ?? []).map((d) => d.shop_group as string).filter(Boolean)));
  return <WishForm tripId={id} defaultKind={kind === "shop" ? "shop" : "place"} groups={groups} />;
}
