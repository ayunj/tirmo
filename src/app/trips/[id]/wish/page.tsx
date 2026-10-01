import Link from "next/link";
import { ChevronLeft, ImageIcon, Plus } from "lucide-react";
import { loadTrip } from "@/lib/trip";
import { days } from "@/lib/format";
import LiveRefresh from "@/components/LiveRefresh";
import ShopList from "@/components/ShopList";
import type { Wish } from "@/lib/types";

export default async function WishPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab = "place" } = await searchParams;
  const { supabase, trip } = await loadTrip(id);
  const [w, ev] = await Promise.all([
    supabase.from("wishes").select("*").eq("trip_id", id).order("created_at"),
    supabase.from("events").select("wish_id, day").eq("trip_id", id).not("wish_id", "is", null),
  ]);
  const all = (w.data ?? []) as Wish[];
  const places = all.filter((x) => x.kind === "place");
  const shops = all.filter((x) => x.kind === "shop");
  const ds = days(trip.start_date, trip.end_date);
  const planned = new Map<string, string | null>();
  for (const e of ev.data ?? []) if (!planned.has(e.wish_id)) planned.set(e.wish_id, e.day);

  return (
    <main>
      <LiveRefresh tripId={id} table="wishes" />
      <header className="hd !pb-1">
        <Link href={`/trips/${id}/more`} className="ib -ml-2" aria-label="뒤로">
          <ChevronLeft size={24} />
        </Link>
        <h1>위시리스트</h1>
        <Link href={`/trips/${id}/wish/new?kind=${tab}`} className="ib" aria-label="추가">
          <Plus size={22} />
        </Link>
      </header>
      <nav className="tabs sticky top-[60px] z-10">
        <Link href="?tab=place" className={tab === "place" ? "on" : ""}>
          가고싶은곳{places.length ? ` ${places.length}` : ""}
        </Link>
        <Link href="?tab=shop" className={tab === "shop" ? "on" : ""}>
          쇼핑{shops.length ? ` ${shops.length}` : ""}
        </Link>
      </nav>

      <div className="px-4 pt-1">
        {tab === "place" ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {places.map((p) => {
                const day = planned.has(p.id) ? planned.get(p.id) : undefined;
                const no = day ? ds.indexOf(day) + 1 : 0;
                return (
                  <div key={p.id} className="card relative overflow-hidden p-2">
                    <Link href={`/trips/${id}/wish/${p.id}`} className="block">
                      <div className="relative aspect-[1/1] overflow-hidden rounded-[14px] bg-line">
                        {p.photos?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photos[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-sub2">
                            <ImageIcon size={26} />
                          </span>
                        )}
                        {day !== undefined && <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[11.5px] font-extrabold text-sky-d">{no ? `DAY ${no}` : "날짜 미정"}</span>}
                      </div>
                      <b className="mt-2 block truncate px-1 text-[15px]">{p.name}</b>
                      <span className="block truncate px-1 pb-1 text-[12.5px] text-sub">{[p.address, p.category].filter(Boolean).join(" · ")}</span>
                    </Link>
                    {day === undefined && (
                      <Link href={`/trips/${id}/plan/new?wish=${p.id}`} className="absolute bottom-2.5 right-2.5 rounded-md bg-white px-1 text-[12px] font-bold text-sky-d">
                        + 일정
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
            {places.length === 0 && <p className="py-12 text-center text-sm text-sub">가고 싶은 곳을 모아 봐요</p>}
          </>
        ) : (
          <>
            <ShopList tripId={id} items={shops} />
            {shops.length === 0 && <p className="py-12 text-center text-sm text-sub">살 것을 적어 봐요</p>}
          </>
        )}
        <Link href={`/trips/${id}/wish/new?kind=${tab}`} className="addline mt-3">
          <Plus size={16} /> {tab === "place" ? "가고싶은곳 추가" : "살 것 추가"}
        </Link>
      </div>
    </main>
  );
}
