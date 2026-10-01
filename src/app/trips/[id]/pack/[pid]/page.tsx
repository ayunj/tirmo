import { notFound } from "next/navigation";
import { packFormData } from "@/lib/packload";
import PackForm from "@/components/PackForm";
import type { PackItem } from "@/lib/types";

export default async function EditPack({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  const { supabase, cats, members, bookings } = await packFormData(id);
  const { data } = await supabase.from("pack_items").select("*").eq("id", pid).eq("trip_id", id).maybeSingle();
  if (!data) notFound();
  return <PackForm tripId={id} item={data as PackItem} cats={cats} members={members} bookings={bookings} />;
}
