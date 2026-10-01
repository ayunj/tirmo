"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { askDel } from "@/lib/ui";
import Ic from "@/components/Ic";

export default function SignOut() {
  const router = useRouter();
  return (
    <div
      style={{ cursor: "pointer" }}
      onClick={async () => {
        if (!(await askDel("로그아웃할까요?", undefined, "로그아웃"))) return;
        await createClient().auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
    >
      <Ic n="log-out" />
      <span>로그아웃</span>
      <Ic n="chevron-right" />
    </div>
  );
}
