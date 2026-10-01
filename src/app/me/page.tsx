import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";
import NicknameForm from "@/components/NicknameForm";

export default async function MePage() {
  const { user, profile } = await getMe();
  if (!user) redirect("/login");
  return (
    <NicknameForm
      mode="edit"
      userId={user.id}
      email={user.email ?? ""}
      initialName={profile?.nickname ?? ""}
      initialColor={profile?.color ?? ""}
    />
  );
}
