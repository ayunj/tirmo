import { loadTrip } from "@/lib/trip";
import { byEv, days, parseDate } from "@/lib/format";
import EventOrder from "@/components/EventOrder";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string }> }) {
  const { id } = await params;
  const { day = "none" } = await searchParams;
  const { supabase, trip } = await loadTrip(id);
  const ds = days(trip.start_date, trip.end_date);
  let q = supabase.from("events").select("id, time_text, sort, title, category").eq("trip_id", id);
  q = day === "none" ? q.is("day", null) : q.eq("day", day);
  const { data } = await q;
  const list = (data ?? []).sort(byEv);
  const no = ds.indexOf(day) + 1;
  const d = day !== "none" ? parseDate(day) : null;
  const title = d ? `DAY ${no} · ${d.getMonth() + 1}월 ${d.getDate()}일` : "날짜 미정";
  return <EventOrder key={day} tripId={id} day={day} title={title} events={list} />;
}
