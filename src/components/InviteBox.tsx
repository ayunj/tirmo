"use client";

import { useEffect, useState } from "react";
import { Copy, Share2 } from "lucide-react";

export default function InviteBox({ code, title }: { code: string; title: string }) {
  const [url, setUrl] = useState(`/join/${code}`);
  const [done, setDone] = useState(false);
  useEffect(() => setUrl(`${location.origin}/join/${code}`), [code]);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  }
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} · 트리모`, text: `${title}에 같이 가요`, url });
      } catch {}
    } else copy();
  }

  return (
    <div className="card p-5">
      <b className="block text-lg">{title}에 초대하기</b>
      <p className="s13 mt-1">링크를 받은 사람은 구글로 로그인하면 바로 같이 쓸 수 있어요.</p>
      <div className="mt-4 flex items-center gap-2 rounded-[14px] bg-bg px-4 py-3">
        <span className="flex-1 truncate text-sm font-semibold">{url.replace(/^https?:\/\//, "")}</span>
        <button onClick={copy} className="flex items-center gap-1 text-[13px] font-bold text-sky-d">
          <Copy size={14} /> {done ? "복사했어요" : "복사"}
        </button>
      </div>
      <button onClick={share} className="btn mt-3 flex items-center justify-center gap-1.5 !bg-[#FEE500] !text-[#191919]">
        <Share2 size={17} /> 카카오톡 등으로 보내기
      </button>
    </div>
  );
}
