import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import type { Member, Trip } from "@/lib/types";

/** 여행 하나와 멤버. 멤버가 아니면 404 */
export async function loadTrip(id: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login");
  // 프로필과 여행을 한 번에 (왕복 1번)
  const [{ data: profile }, { data }] = await Promise.all([
    supabase.from("profiles").select("onboarded").eq("id", user.id).maybeSingle(),
    supabase.from("trips").select("*, trip_members(user_id, role, joined_at, profiles(nickname, color))").eq("id", id).maybeSingle(),
  ]);
  if (!profile?.onboarded) redirect("/onboarding");
  if (!data) notFound();
  const { trip_members, ...trip } = data as Trip & { trip_members: Member[] };
  const members = [...trip_members].sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
  return { supabase, user, trip: trip as Trip, members };
}
