import { loadTrip } from "@/lib/trip";
import { CURRENCIES } from "@/lib/places";
import { BOOKING_KINDS } from "@/lib/booking";
import Go from "@/components/Go";
import TripTitle from "@/components/TripTitle";
import Ic, { type IcName } from "@/components/Ic";
import SignOut from "@/components/SignOut";

export default async function MorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, trip, members, user } = await loadTrip(id);
  const [bk, pk, ws, en, me] = await Promise.all([
    supabase.from("bookings").select("kind").eq("trip_id", id),
    supabase.from("pack_items").select("done").eq("trip_id", id).or(`assignee.eq.${user.id},assignee.is.null`),
    supabase.from("wishes").select("*").eq("trip_id", id),
    supabase.from("entries").select("photos").eq("trip_id", id).eq("created_by", user.id),
    supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle(),
  ]);
  const kinds = BOOKING_KINDS.map((k) => [k.short, (bk.data ?? []).filter((b) => b.kind === k.key).length] as const).filter(([, n]) => n);
  const packs = pk.data ?? [];
  const nEn = (en.data ?? []).length;
  const nPh = (en.data ?? []).reduce((s, e) => s + (e.photos as string[]).length, 0);
  const wv = (ws.data ?? []).filter((w) => w.created_by === user.id || w.shared !== false);
  const wPlace = wv.filter((w) => w.kind === "place").length;
  const wShop = wv.length - wPlace;
  const c = CURRENCIES[trip.currency];
  const b = `/trips/${id}`;
  const tiles: [string, IcName, string, string, string][] = [
    [`${b}/bookings`, "ticket", "blue", "예약", kinds.length ? kinds.map(([k, n]) => `${k} ${n}`).join(" · ") : "항공 · 숙소 · 식당"],
    [`${b}/money`, "wallet", "amber", "경비", "예산 · 내역 · 정산"],
    [`${b}/diary`, "book-open", "violet", "여행 기록", nEn ? `기록 ${nEn} · 사진 ${nPh}` : "사진 + 일기"],
    [`${b}/pack`, "luggage", "green", "준비물", packs.length ? `${packs.filter((p) => p.done).length} / ${packs.length}` : "체크리스트"],
    [`${b}/wish`, "heart", "acc", "위시리스트", wPlace + wShop ? `가고싶은곳 ${wPlace} · 쇼핑 ${wShop}` : "가고싶은곳 · 쇼핑"],
    ["", "file-text", "ink", "PDF 여행책", "곧 열려요"],
  ];
  return (
    <section className="screen on" id="more">
      <div className="scr">
        <div className="hd">
          <TripTitle id={id} title={trip.title} start={trip.start_date} end={trip.end_date} label="더보기" />
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          <div className="mgrid">
            {tiles.map(([href, n, col, t, s]) => (
              <Go key={t} href={href || undefined} style={href ? undefined : { opacity: 0.55, cursor: "default" }}>
                <span className={`mg-ic ${col}`}>
                  <Ic n={n} />
                </span>
                <b>{t}</b>
                <span>{s}</span>
              </Go>
            ))}
          </div>
          <div className="mlist">
            <Go href={`${b}/edit`}>
              <Ic n="pencil" />
              <span>여행 정보 수정</span>
              <Ic n="chevron-right" />
            </Go>
            <Go href={`${b}/invite`}>
              <Ic n="users" />
              <span>
                함께하는 사람 <i className="sub">{members.length}명</i>
              </span>
              <Ic n="chevron-right" />
            </Go>
            {trip.currency !== "KRW" && c && (
              <Go href={`${b}/edit`}>
                <Ic n="arrow-left-right" />
                <span>
                  환율{" "}
                  <i className="sub">
                    {c.sym.trim()}
                    {trip.rate_unit.toLocaleString()} = ₩{Number(trip.rate).toLocaleString()}
                  </i>
                </span>
                <Ic n="chevron-right" />
              </Go>
            )}
            <Go href="/me" id="moreMe">
              <Ic n="user-round" />
              <span>
                내 이름 <i className="sub">{me.data?.nickname}</i>
              </span>
              <Ic n="chevron-right" />
            </Go>
            <Go href="/">
              <Ic n="folder" />
              <span>다른 여행 보기</span>
              <Ic n="chevron-right" />
            </Go>
            <SignOut />
          </div>
        </div>
      </div>
    </section>
  );
}
