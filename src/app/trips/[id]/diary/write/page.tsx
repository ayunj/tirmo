import { entryFormData } from "@/lib/diaryload";
import EntryForm from "@/components/EntryForm";

export default async function WriteEntry({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string }> }) {
  const { id } = await params;
  const { day } = await searchParams;
  const { days, events } = await entryFormData(id);
  return <EntryForm tripId={id} days={days} events={events} defaultDay={day} />;
}
