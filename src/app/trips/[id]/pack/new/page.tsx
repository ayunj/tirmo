import { packFormData } from "@/lib/packload";
import PackForm from "@/components/PackForm";

export default async function NewPack({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ cat?: string }> }) {
  const { id } = await params;
  const { cat } = await searchParams;
  const { cats, members, bookings } = await packFormData(id);
  return <PackForm tripId={id} defaultCat={cat} cats={cats} members={members} bookings={bookings} />;
}
