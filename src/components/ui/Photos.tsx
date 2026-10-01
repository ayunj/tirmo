"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/** 사진 모음 · 누르면 크게 */
export default function Photos({ urls, cols = 3 }: { urls: string[]; cols?: number }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!urls?.length) return null;
  return (
    <>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {urls.map((u, i) => (
          <button key={u} onClick={() => setOpen(i)} className="aspect-square overflow-hidden rounded-xl bg-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
      {open != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[open]} alt="" className="max-h-full max-w-full object-contain" />
          <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white" aria-label="닫기">
            <X size={22} />
          </button>
          {urls.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open - 1 + urls.length) % urls.length);
                }}
                aria-label="이전"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open + 1) % urls.length);
                }}
                aria-label="다음"
              >
                <ChevronRight size={22} />
              </button>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/80">
                {open + 1} / {urls.length}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
