import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";
import { coverDate, cv } from "@/lib/cover";
import JoinButton from "@/components/JoinButton";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { supabase, user, profile } = await getMe();
  if (!user) redirect(`/login?next=/join/${code}`);
  if (!profile?.onboarded) redirect(`/onboarding?next=/join/${code}`);

  const { data } = await supabase.rpc("peek_invite", { p_code: code });
  const t = Array.isArray(data) ? data[0] : null;
  if (!t) {
    return (
      <section className="screen on">
        <div className="scr full nonav login2">
          <div className="lg-box">
            <b style={{ fontSize: 19 }}>초대 링크가 맞지 않아요</b>
            <p>링크를 다시 받아 주세요</p>
          </div>
        </div>
      </section>
    );
  }
  const { data: mine } = await supabase.from("trip_members").select("trip_id").eq("trip_id", t.id).eq("user_id", user.id).maybeSingle();
  if (mine) redirect(`/trips/${t.id}`);

  return (
    <section className="screen on" id="join">
      <div className="scr full nonav">
        <div className="pad" style={{ paddingTop: 70 }}>
          <div className="upcoming colorcv" style={cv({ cover_color: t.cover_color })}>
            <div className="cc">
              <div className="disp cc-t">{t.title}</div>
              <div className="cc-d">{coverDate(t.start_date, t.end_date)}</div>
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: 15, marginTop: 22 }}>
            <b>{t.members}명</b>이 같이 준비하고 있어요
          </p>
          <JoinButton code={code} />
        </div>
      </div>
    </section>
  );
}
