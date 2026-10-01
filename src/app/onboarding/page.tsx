import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";
import NicknameForm from "@/components/NicknameForm";

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const { user, profile } = await getMe();
  if (!user) redirect("/login");
  return (
    <NicknameForm
      mode="onboarding"
      userId={user.id}
      email={user.email ?? ""}
      initialName={profile?.nickname ?? ""}
      initialColor={profile?.color ?? ""}
      next={next && next.startsWith("/") ? next : "/"}
    />
  );
}
