import { notFound } from "next/navigation";
import { entryFormData } from "@/lib/diaryload";
import EntryForm from "@/components/EntryForm";
import type { Entry } from "@/lib/types";

export default async function EditEntry({ params }: { params: Promise<{ id: string; did: string }> }) {
  const { id, did } = await params;
  const { supabase, days, events } = await entryFormData(id);
  const { data } = await supabase.from("entries").select("*").eq("id", did).eq("trip_id", id).maybeSingle();
  if (!data) notFound();
  return <EntryForm tripId={id} days={days} events={events} entry={data as Entry} />;
}
