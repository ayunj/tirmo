import { notFound, redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";
import type { Member, Trip } from "@/lib/types";

/** 여행 하나와 멤버. 멤버가 아니면 404 */
export async function loadTrip(id: string) {
  const { supabase, user, profile } = await getMe();
  if (!user) redirect("/login");
  if (!profile?.onboarded) redirect("/onboarding");
  const { data } = await supabase
    .from("trips")
    .select("*, trip_members(user_id, role, joined_at, profiles(nickname, color))")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const { trip_members, ...trip } = data as Trip & { trip_members: Member[] };
  const members = [...trip_members].sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
  return { supabase, user, trip: trip as Trip, members };
}
