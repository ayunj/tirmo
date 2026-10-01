import { notFound } from "next/navigation";
import { entryFormData } from "@/lib/diaryload";
import EntryForm from "@/components/EntryForm";
import type { Entry } from "@/lib/types";

export default async function EditEntry({ params }: { params: Promise<{ id: string; did: string }> }) {
  const { id, did } = await params;
  const d = await entryFormData(id);
  const { data } = await d.supabase.from("entries").select("*").eq("id", did).eq("trip_id", id).maybeSingle();
  if (!data) notFound();
  return <EntryForm tripId={id} days={d.days} events={d.events} entry={data as Entry} me={d.user.id} currency={d.trip.currency} pockets={d.pockets} />;
}
