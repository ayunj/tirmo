import { loadTrip } from "@/lib/trip";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import InviteBox, { LeaveTrip } from "@/components/InviteBox";

export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trip, members, user } = await loadTrip(id);
  const joined = (s?: string) => (s ? `${new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" }).format(new Date(s))} 참여` : "");
  const meOwner = members.find((m) => m.user_id === user.id)?.role === "owner";
  return (
    <section className="screen on" id="invite">
      <div className="scr nonav">
        <div className="hd">
          <Go as="span" className="ib" back>
            <Ic n="chevron-left" />
          </Go>
          <h2>함께하는 사람</h2>
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          <InviteBox code={trip.invite_code} title={trip.title} />
          <div className="stt">멤버 {members.length}명</div>
          <div className="boxc members">
            {members.map((m) => {
              const me = m.user_id === user.id;
              const nm = m.profiles?.nickname || "?";
              return (
                <div key={m.user_id}>
                  <span className="av">
                    <i style={{ background: m.profiles?.color || "#8B95A1" }}>{nm.slice(0, 1)}</i>
                  </span>
                  <div className="mid">
                    <b>
                      {nm} {me && <span className="tag">나</span>}
                    </b>
                    <div className="s">{me ? user.email : joined(m.joined_at)}</div>
                  </div>
                  {m.role === "owner" ? <span className="tag amber">방장</span> : <span className="sub">{m.role === "viewer" ? "보기만" : "편집 가능"}</span>}
                </div>
              );
            })}
          </div>
          {!meOwner && <LeaveTrip tripId={id} me={user.id} />}
        </div>
      </div>
    </section>
  );
}
