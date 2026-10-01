"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** 같은 여행 멤버가 바꾸면 화면을 새로 그려요 */
export default function LiveRefresh({ tripId, table }: { tripId: string; table: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`${table}-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table, filter: `trip_id=eq.${tripId}` }, () => router.refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [tripId, table, router]);
  return null;
}
