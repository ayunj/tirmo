"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { askDel, toast } from "@/lib/ui";
import Ic from "@/components/Ic";

type Move = { from: string; to: string; amount: number; label: string };

async function record(tripId: string, m: Move) {
  const { error } = await createClient().from("transfers").insert({ trip_id: tripId, from_id: m.from, to_id: m.to, amount: m.amount });
  if (error) toast("저장하지 못했어요");
  else toast("받은 걸로 적었어요");
  return !error;
}

/** 남은 금액 줄 · 누르면 받았어요 */
export function MoveRow({ tripId, m, children }: { tripId: string; m: Move; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div
      style={{ cursor: "pointer" }}
      onClick={async () => {
        if (!(await askDel(`${m.label} ₩${m.amount.toLocaleString("ko-KR")}`, "받았으면 완료로 바꿔요", "받았어요"))) return;
        if (await record(tripId, m)) router.refresh();
      }}
    >
      {children}
    </div>
  );
}

export function SettleButtons({ tripId, text, moves }: { tripId: string; text: string; moves: Move[] }) {
  const router = useRouter();
  return (
    <div className="btns2">
      <div
        onClick={async () => {
          if (navigator.share) {
            try {
              await navigator.share({ text });
            } catch {}
          } else {
            await navigator.clipboard.writeText(text);
            toast("정산 내용을 복사했어요");
          }
        }}
      >
        <Ic n="send" /> 송금 요청 보내기
      </div>
      <div
        onClick={async () => {
          if (!moves.length) return toast("남은 정산이 없어요");
          if (moves.length > 1) return toast("받은 줄을 눌러 주세요");
          const m = moves[0];
          if (!(await askDel(`${m.label} ₩${m.amount.toLocaleString("ko-KR")}`, "받았으면 완료로 바꿔요", "받았어요"))) return;
          if (await record(tripId, m)) router.refresh();
        }}
      >
        <Ic n="check" /> 받았어요
      </div>
    </div>
  );
}

export function UndoTransfer({ id }: { id: string }) {
  const router = useRouter();
  return (
    <span
      className="tag green"
      style={{ cursor: "pointer" }}
      onClick={async () => {
        if (!(await askDel("완료를 되돌릴까요?", "받은 기록이 지워져요", "되돌리기"))) return;
        await createClient().from("transfers").delete().eq("id", id);
        router.refresh();
      }}
    >
      <Ic n="check" /> 완료
    </span>
  );
}
