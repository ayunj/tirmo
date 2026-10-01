"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/ui";

export default function JoinButton({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <div
      className="bigbtn"
      style={{ marginTop: 22, opacity: busy ? 0.6 : 1 }}
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        const { data, error } = await createClient().rpc("join_trip", { p_code: code });
        if (error || !data) {
          setBusy(false);
          return toast("참여하지 못했어요. 링크를 다시 확인해 주세요");
        }
        router.replace(`/trips/${data}`);
        router.refresh();
      }}
    >
      {busy ? "들어가는 중…" : "같이 가기"}
    </div>
  );
}
