"use client";

import { useRouter } from "next/navigation";
import { Check, Send, Undo2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function PaidButton({ tripId, from, to, amount, label }: { tripId: string; from: string; to: string; amount: number; label: string }) {
  const router = useRouter();
  return (
    <button
      className="flex flex-none items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[12.5px] font-bold text-ink2"
      onClick={async () => {
        if (!confirm(`${label} ₩${amount.toLocaleString("ko-KR")} 보냈어요?`)) return;
        const { error } = await createClient().from("transfers").insert({ trip_id: tripId, from_id: from, to_id: to, amount });
        if (error) return alert("저장하지 못했어요");
        router.refresh();
      }}
    >
      <Check size={14} /> 보냈어요
    </button>
  );
}

export function UndoTransfer({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="grid h-8 w-8 place-items-center rounded-full text-sub"
      aria-label="되돌리기"
      onClick={async () => {
        if (!confirm("이 기록을 지울까요?")) return;
        const { error } = await createClient().from("transfers").delete().eq("id", id);
        if (error) return alert("지우지 못했어요");
        router.refresh();
      }}
    >
      <Undo2 size={16} />
    </button>
  );
}

export function ShareSettle({ text }: { text: string }) {
  return (
    <button
      className="btn flex items-center justify-center gap-1.5"
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({ text });
          } catch {}
        } else {
          await navigator.clipboard.writeText(text);
          alert("복사했어요");
        }
      }}
    >
      <Send size={17} /> 정산 내용 보내기
    </button>
  );
}
