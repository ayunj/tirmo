"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinButton({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn mt-6"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const { data, error } = await createClient().rpc("join_trip", { p_code: code });
        if (error || !data) {
          setBusy(false);
          return alert("참여하지 못했어요. 링크를 다시 확인해 주세요.");
        }
        router.replace(`/trips/${data}`);
        router.refresh();
      }}
    >
      {busy ? "들어가는 중…" : "같이 가기"}
    </button>
  );
}
