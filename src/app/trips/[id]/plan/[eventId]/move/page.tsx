import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip";
import { byEv } from "@/lib/format";
import MoveForm from "@/components/MoveForm";
import type { EventRow, Pocket } from "@/lib/types";

export default async function MovePage({ params }: { params: Promise<{ id: string; eventId: string }> }) {
  const { id, eventId } = await params;
  const { supabase, trip, user } = await loadTrip(id);
  const [{ data }, pk] = await Promise.all([supabase.from("events").select("*").eq("id", eventId).eq("trip_id", id).maybeSingle(), supabase.from("pockets").select("*").eq("trip_id", id).order("shared", { ascending: false })]);
  if (!data) notFound();
  const ev = data as EventRow;
  const q = supabase.from("events").select("id, title, time_text, category, sort").eq("trip_id", id);
  const { data: same } = ev.day ? await q.eq("day", ev.day) : await q.is("day", null);
  const list = ((same ?? []) as (Pick<EventRow, "id" | "title" | "time_text" | "category" | "sort">)[]).sort(byEv);
  const i = list.findIndex((x) => x.id === ev.id);
  return <MoveForm ev={ev} prev={i > 0 ? list[i - 1] : null} currency={trip.currency} pockets={(pk.data ?? []) as Pocket[]} me={user.id} />;
}
