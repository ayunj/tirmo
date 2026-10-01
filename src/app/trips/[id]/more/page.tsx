import Link from "next/link";
import { BookOpen, ChevronRight, FileText, Folder, Heart, Luggage, Pencil, Ticket, UserRound, Users, Wallet } from "lucide-react";
import { loadTrip } from "@/lib/trip";
import SignOut from "@/components/SignOut";

export default async function MorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, members } = await loadTrip(id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const n = async (t: string, f?: (q: any) => any) => {
    let q = supabase.from(t).select("id", { count: "exact", head: true }).eq("trip_id", id);
    if (f) q = f(q);
    return (await q).count ?? 0;
  };
  const [bk, pk, pkDone, ws, en, ex] = await Promise.all([
    n("bookings"),
    n("pack_items"),
    n("pack_items", (q) => q.eq("done", true)),
    n("wishes"),
    n("entries"),
    n("expenses"),
  ]);
  const tiles = [
    { href: `/trips/${id}/bookings`, icon: Ticket, label: "예약", sub: bk ? `${bk}개` : "항공 · 숙소 · 식당", color: "bg-sky-s text-sky-d" },
    { href: `/trips/${id}/money`, icon: Wallet, label: "경비", sub: ex ? `${ex}건` : "포켓 · 정산", color: "bg-[#FFF3DA] text-[#B07400]" },
    { href: `/trips/${id}/diary`, icon: BookOpen, label: "여행 기록", sub: en ? `${en}개` : "사진 · 오늘의 기록", color: "bg-[#EFEAF9] text-[#6B54B8]" },
    { href: `/trips/${id}/pack`, icon: Luggage, label: "준비물", sub: pk ? `${pkDone} / ${pk} 챙김` : "체크리스트", color: "bg-[#E4F4EB] text-green" },
    { href: `/trips/${id}/wish`, icon: Heart, label: "위시리스트", sub: ws ? `${ws}개` : "가고싶은곳 · 쇼핑", color: "bg-[#FDEDEB] text-red" },
    { href: "", icon: FileText, label: "PDF 여행책", sub: "곧 열려요", color: "bg-bg text-ink2" },
  ];
  return (
    <main>
      <header className="hd">
        <h1 className="!text-[24px]">더보기</h1>
      </header>
      <div className="px-4 pt-3">
        <div className="grid grid-cols-2 gap-2.5">
          {tiles.map(({ href, icon: I, label, sub, color }) => {
            const inner = (
              <>
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}>
                  <I size={20} />
                </span>
                <b className="mt-3 block">{label}</b>
                <span className="s13">{sub}</span>
              </>
            );
            return href ? (
              <Link key={label} href={href} className="card p-4">
                {inner}
              </Link>
            ) : (
              <div key={label} className="card p-4 opacity-60">
                {inner}
              </div>
            );
          })}
        </div>
        <div className="card mt-3 px-4">
          {[
            { href: `/trips/${id}/edit`, icon: Pencil, label: "여행 정보 수정" },
            { href: `/trips/${id}/invite`, icon: Users, label: `함께하는 사람 · ${members.length}명` },
            { href: "/me", icon: UserRound, label: "내 이름" },
            { href: "/", icon: Folder, label: "다른 여행 보기" },
          ].map(({ href, icon: I, label }, i) => (
            <Link key={href} href={href} className={`flex items-center gap-3 py-4 ${i ? "border-t border-line" : ""}`}>
              <I size={19} className="text-ink2" />
              <span className="flex-1 text-[15px]">{label}</span>
              <ChevronRight size={17} className="text-sub2" />
            </Link>
          ))}
        </div>
        <SignOut />
      </div>
    </main>
  );
}
