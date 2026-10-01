import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { loadTrip } from "@/lib/trip";
import InviteBox from "@/components/InviteBox";

export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trip, members, user } = await loadTrip(id);
  return (
    <main>
      <header className="hd">
        <Link href={`/trips/${id}`} className="ib" aria-label="뒤로">
          <ChevronLeft size={22} />
        </Link>
        <h1>함께하는 사람</h1>
      </header>
      <div className="px-4 pt-3">
        <InviteBox code={trip.invite_code} title={trip.title} />
        <div className="mx-1 mb-2 mt-6 font-bold">멤버 {members.length}명</div>
        <div className="card px-4 py-1">
          {members.map((m, i) => (
            <div key={m.user_id} className={`flex items-center gap-3 py-3 ${i ? "border-t border-line" : ""}`}>
              <span className="grid h-10 w-10 place-items-center rounded-full text-sm font-extrabold text-white" style={{ background: m.profiles?.color || "#8B95A1" }}>
                {[...(m.profiles?.nickname || "?")][0]}
              </span>
              <b className="flex-1 font-semibold">
                {m.profiles?.nickname || "이름 없음"}
                {m.user_id === user.id && <span className="ml-1.5 rounded-md bg-bg px-1.5 py-0.5 text-[11px] text-sub">나</span>}
              </b>
              <span className={`text-[13px] font-semibold ${m.role === "owner" ? "text-[#B07400]" : "text-sub"}`}>{m.role === "owner" ? "방장" : m.role === "viewer" ? "보기만" : "편집 가능"}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
