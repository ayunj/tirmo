import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";
import { dday, today } from "@/lib/format";
import { country } from "@/lib/places";
import { coverDate, cv, shortRange } from "@/lib/cover";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import { CvFlags, Names } from "@/components/TripFlags";
import TripSearch from "@/components/TripSearch";
import TripRows from "@/components/TripRows";
import type { Member, Trip } from "@/lib/types";

type Row = Trip & { trip_members: Member[]; entries: { count: number }[] };

export default async function TripsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { supabase, user, profile } = await getMe();
  if (!user) redirect("/login");
  if (!profile?.onboarded) redirect("/onboarding");

  const { data } = await supabase
    .from("trips")
    .select("*, trip_members(user_id, role, profiles(nickname, color)), entries(count)")
    .order("start_date", { ascending: false, nullsFirst: true });
  const all = (data ?? []) as Row[];
  const trips = q ? all.filter((t) => [t.title, ...t.cities, ...t.countries.map((c) => country(c)?.name ?? "")].join(" ").includes(q)) : all;
  const now = today();
  const upcoming = trips.filter((t) => !t.end_date || t.end_date >= now).sort((a, b) => (a.start_date ?? "9999").localeCompare(b.start_date ?? "9999"));
  const past = trips.filter((t) => t.end_date && t.end_date < now);

  const nDays = trips.reduce((s, t) => (t.start_date ? s + Math.round((new Date(t.end_date || t.start_date).getTime() - new Date(t.start_date).getTime()) / 864e5) + 1 : s), 0);
  const nCountries = new Set(trips.flatMap((t) => (t.kind === "abroad" ? t.countries : ["kr"]))).size;
  const names = (t: Row) => t.trip_members.map((m) => ({ nickname: m.profiles?.nickname || "?", color: m.profiles?.color || "#8B95A1" }));
  const label = (t: Row) => (t.kind === "domestic" ? t.cities[0] : country(t.countries[0] ?? "")?.name) || t.title.slice(0, 4);

  const rows = past.map((t) => {
    const n = t.trip_members.length;
    const rec = t.entries?.[0]?.count ?? 0;
    const sub = [shortRange(t.start_date, t.end_date), n > 1 ? `${n}명` : "혼자", rec ? `기록 ${rec}` : ""].filter(Boolean).join(" · ");
    return { id: t.id, year: (t.start_date ?? "").slice(0, 4), title: t.title, sub, label: label(t), color: t.cover_color, trip: { kind: t.kind, countries: t.countries, cities: t.cities } };
  });

  return (
    <section className="screen on" id="trips">
      <div className="scr nonav">
        <div className="hd">
          <h2 className="big">내 여행</h2>
          <TripSearch q={q} />
          <Go as="span" className="ib dark" href="/trips/new">
            <Ic n="plus" />
          </Go>
        </div>
        <div className="pad">
          {all.length > 0 && !q && (
            <div className="sub" style={{ margin: "-4px 0 12px" }}>
              {all.length}개의 여행 · {nCountries}개국 · {nDays}일
            </div>
          )}
          {upcoming.map((t) => (
            <Go key={t.id} className="upcoming colorcv" href={`/trips/${t.id}`} style={{ ...cv(t), marginBottom: 10 }}>
              {t.cover_photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="im" src={t.cover_photo} alt="" />
              )}
              {t.start_date && <span className="glass pill">{dday(t.start_date, t.end_date)}</span>}
              <div className="cc">
                <CvFlags trip={t} up />
                <div className="disp cc-t">{t.title}</div>
                <div className="cc-d">{coverDate(t.start_date, t.end_date)}</div>
                <Names list={names(t)} oncv style={{ justifyContent: "center", marginTop: 14 }} />
              </div>
            </Go>
          ))}
          {all.length === 0 && (
            <Go className="addline" href="/trips/new" style={{ marginTop: 8 }}>
              <Ic n="plus" /> 첫 여행 만들기
            </Go>
          )}
          <TripRows rows={rows} />
          {q && trips.length === 0 && <div className="sub" style={{ textAlign: "center", padding: "40px 0" }}>찾는 여행이 없어요</div>}
        </div>
      </div>
    </section>
  );
}
