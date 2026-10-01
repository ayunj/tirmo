"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { askDel, toast } from "@/lib/ui";
import Ic from "@/components/Ic";

export default function InviteBox({ code, title }: { code: string; title: string }) {
  const [url, setUrl] = useState(`/join/${code}`);
  useEffect(() => setUrl(`${location.origin}/join/${code}`), [code]);
  async function copy() {
    await navigator.clipboard.writeText(url);
    toast("링크를 복사했어요");
  }
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} · 트리모`, text: `${title} 같이 준비해요`, url });
      } catch {}
    } else copy();
  }
  return (
    <div className="invcard">
      <div className="ic-il">
        <svg viewBox="0 0 120 100">
          <g stroke="#4A403A" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
            <path d="M58 46 L42 20 Q46 17 52 19 L76 40Z" fill="#A9C8F0" />
            <path d="M16 66 Q26 54 76 36 L98 28 Q112 24 107 36 Q101 45 86 51 L34 72 Q20 77 16 66Z" fill="#FFFFFF" />
            <path d="M52 62 L50 86 Q56 88 60 84 L70 56Z" fill="#A9C8F0" />
            <path d="M22 62 L12 46 Q16 42 22 44 L34 58Z" fill="#A9C8F0" />
          </g>
          <g fill="#7FA8E0">
            <circle cx="46" cy="58" r="2.6" />
            <circle cx="56" cy="54" r="2.6" />
            <circle cx="66" cy="50" r="2.6" />
            <circle cx="76" cy="46" r="2.6" />
          </g>
        </svg>
      </div>
      <b>{title}에 초대하기</b>
      <span>링크를 받은 사람은 구글 로그인만 하면 바로 같이 쓸 수 있어요.</span>
      <div className="invlink" onClick={copy}>
        <span>{url.replace(/^https?:\/\//, "")}</span>
        <em>
          <Ic n="copy" /> 복사
        </em>
      </div>
      <div className="invbtns">
        <div className="kakao" onClick={share}>
          <Ic n="message-circle" /> 카카오톡으로 보내기
        </div>
        <div onClick={share}>
          <Ic n="share-2" />
        </div>
      </div>
    </div>
  );
}

export function LeaveTrip({ tripId, me }: { tripId: string; me: string }) {
  const router = useRouter();
  return (
    <div
      className="dellink"
      onClick={async () => {
        if (!(await askDel("이 여행에서 나갈까요?", "다시 들어오려면 초대 링크가 필요해요", "나가기"))) return;
        const { error } = await createClient().from("trip_members").delete().eq("trip_id", tripId).eq("user_id", me);
        if (error) return toast("나가지 못했어요");
        router.replace("/");
        router.refresh();
      }}
    >
      <Ic n="arrow-right" /> 이 여행에서 나가기
    </div>
  );
}
