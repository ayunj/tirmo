import TripNav from "@/components/TripNav";

export default async function TripLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <div className="pb-24">{children}</div>
      <TripNav id={id} />
    </>
  );
}
