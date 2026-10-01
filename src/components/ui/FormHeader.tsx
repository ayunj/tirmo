"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function FormHeader({ title, onSave, canSave = true, busy = false }: { title: string; onSave: () => void; canSave?: boolean; busy?: boolean }) {
  const router = useRouter();
  return (
    <header className="hd">
      <button className="ib" onClick={() => router.back()} aria-label="닫기">
        <X size={22} />
      </button>
      <h1>{title}</h1>
      <button className="px-1 text-[15px] font-bold text-sky-d disabled:text-sub2" disabled={!canSave || busy} onClick={onSave}>
        {busy ? "저장 중" : "저장"}
      </button>
    </header>
  );
}
