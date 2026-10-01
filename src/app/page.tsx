import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, UserRound } from "lucide-react";
import { getMe } from "@/lib/supabase/server";
import { dday, range } from "@/lib/format";
import { Flags, NamePill, coverStyle } from "@/components/bits";
import type { Member, Trip } from "@/lib/types";

export default async function TripsPage() {
  const { supabase, user, profile } = await getMe();
  if (!user) redirect("/login");
  if (!profile?.onboarded) redirect("/onboarding");

  const { data } = await supabase
    .from("trips")
    .select("*, trip_members(user_id, role, profiles(nickname, color))")
    .order("start_date", { ascending: false, nullsFirst: true });
  const trips = (data ?? []) as (Trip & { trip_members: Member[] })[];

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips
    .filter((t) => !t.end_date || t.end_date >= today)
    .sort((a, b) => (a.start_date ?? "9999").localeCompare(b.start_date ?? "9999"));
  const past = trips.filter((t) => t.end_date && t.end_date < today);
  const byYear = past.reduce<Record<string, typeof past>>((acc, t) => {
    const y = (t.start_date ?? "").slice(0, 4) || "날짜 없음";
    (acc[y] ||= []).push(t);
    return acc;
  }, {});

  return (
    <main className="pb-16">
      <header className="hd">
        <h1 className="!text-[24px]">내 여행</h1>
        <Link href="/me" className="ib" aria-label="내 이름">
          <UserRound size={21} />
        </Link>
        <Link href="/trips/new" className="ib" aria-label="새 여행">
          <Plus size={22} />
        </Link>
      </header>

      <div className="px-4 pt-3">
        {trips.length === 0 && (
          <div className="card mt-2 px-6 py-12 text-center">
            <p className="text-[17px] font-bold">아직 여행이 없어요</p>
            <p className="s13 mt-1">첫 여행을 만들거나 받은 초대 링크를 열어 주세요</p>
            <Link href="/trips/new" className="btn mt-6">
              새 여행 만들기
            </Link>
          </div>
        )}

        {upcoming.map((t) => (
          <Link key={t.id} href={`/trips/${t.id}`} className="relative mb-3 block h-[200px] overflow-hidden rounded-[22px] text-white" style={coverStyle(t)}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
            <div className="relative flex h-full flex-col p-5">
              <div className="flex items-center justify-between">
                <Flags trip={t} size={18} />
                <span className="rounded-full bg-black/30 px-2.5 py-1 text-xs font-bold">{dday(t.start_date, t.end_date)}</span>
              </div>
              <div className="mt-auto text-[24px] font-extrabold leading-tight tracking-tight">{t.title}</div>
              <div className="mt-1 text-[12.5px] font-semibold opacity-90">{range(t.start_date, t.end_date)}</div>
              <div className="mt-2.5 flex gap-1">
                {t.trip_members.map((m) => (
                  <NamePill key={m.user_id} name={m.profiles?.nickname || "?"} color={m.profiles?.color || "#8B95A1"} />
                ))}
              </div>
            </div>
          </Link>
        ))}

        {Object.keys(byYear)
          .sort()
          .reverse()
          .map((y) => (
            <section key={y}>
              <div className="mx-1 mb-2 mt-5 text-[13px] font-bold text-sub">{y}</div>
              <div className="card overflow-hidden">
                {byYear[y].map((t, i) => (
                  <Link key={t.id} href={`/trips/${t.id}`} className={`flex items-center gap-3 px-4 py-3 ${i ? "border-t border-line" : ""}`}>
                    <div className="h-12 w-12 flex-none rounded-xl" style={coverStyle(t)} />
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-base font-semibold">{t.title}</b>
                      <span className="s13">
                        {range(t.start_date, t.end_date)} · {t.trip_members.length > 1 ? `${t.trip_members.length}명` : "혼자"}
                      </span>
                    </div>
                    <Flags trip={t} />
                  </Link>
                ))}
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}
