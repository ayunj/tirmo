import { entryFormData } from "@/lib/diaryload";
import EntryForm from "@/components/EntryForm";

export default async function WriteEntry({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string; event?: string }> }) {
  const { id } = await params;
  const { day, event } = await searchParams;
  const d = await entryFormData(id);
  return <EntryForm tripId={id} days={d.days} events={d.events} defaultDay={day} defaultEvent={event} me={d.user.id} currency={d.trip.currency} pockets={d.pockets} />;
}
