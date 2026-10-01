import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";
import { range } from "@/lib/format";
import { coverStyle } from "@/components/bits";
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
      <main className="px-8 pt-32 text-center">
        <b className="text-lg">초대 링크가 맞지 않아요</b>
        <p className="s13 mt-1">링크를 다시 받아 주세요</p>
      </main>
    );
  }
  const { data: mine } = await supabase.from("trip_members").select("trip_id").eq("trip_id", t.id).eq("user_id", user.id).maybeSingle();
  if (mine) redirect(`/trips/${t.id}`);

  return (
    <main className="px-5 pt-16">
      <div className="flex h-[200px] flex-col items-center justify-center rounded-[22px] text-white" style={coverStyle({ cover_color: t.cover_color, cover_photo: null })}>
        <div className="text-[24px] font-extrabold tracking-tight">{t.title}</div>
        <div className="mt-1 text-[13px] opacity-90">{range(t.start_date, t.end_date)}</div>
      </div>
      <p className="mt-6 text-center text-[15px]">
        <b>{t.members}명</b>이 같이 준비하고 있어요
      </p>
      <JoinButton code={code} />
    </main>
  );
}
