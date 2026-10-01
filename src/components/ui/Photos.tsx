"use client";

import { useState } from "react";
import Ic from "@/components/Ic";

/** 사진 모음 · 누르면 크게 */
export default function Photos({ urls, cols = 3, bare }: { urls: string[]; cols?: number; bare?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!urls?.length) return null;
  const items = urls.map((u, i) => (
    <div key={u} onClick={() => setOpen(i)} style={{ cursor: "zoom-in", ...(bare ? {} : { aspectRatio: "1", borderRadius: 12, overflow: "hidden" }) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="im" src={u} alt="" loading="lazy" />
    </div>
  ));
  return (
    <>
      {bare ? items : <div style={{ display: "grid", gap: 6, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{items}</div>}
      {open != null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.92)" }} onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[open]} alt="" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
          <button className="glass circ" style={{ position: "absolute", right: 16, top: 16 }} aria-label="닫기">
            <Ic n="x" />
          </button>
          {urls.length > 1 && (
            <>
              <button
                className="glass circ" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open - 1 + urls.length) % urls.length);
                }}
                aria-label="이전"
              >
                <Ic n="chevron-left" />
              </button>
              <button
                className="glass circ" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open + 1) % urls.length);
                }}
                aria-label="다음"
              >
                <Ic n="chevron-right" />
              </button>
              <span style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", fontSize: 14, color: "rgba(255,255,255,.8)" }}>
                {open + 1} / {urls.length}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
