import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";
import { recentPlaces } from "@/lib/recent";
import TripForm from "@/components/TripForm";

export default async function NewTrip() {
  const { supabase, user, profile } = await getMe();
  if (!user) redirect("/login?next=/trips/new");
  if (!profile?.onboarded) redirect("/onboarding?next=/trips/new");
  const recent = await recentPlaces(supabase);
  return <TripForm members={[{ nickname: profile.nickname, color: profile.color }]} {...recent} />;
}
