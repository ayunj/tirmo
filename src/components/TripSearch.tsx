"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Ic from "@/components/Ic";

export default function TripSearch({ q }: { q: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(!!q);
  const [v, setV] = useState(q);
  if (!open)
    return (
      <span className="ib" onClick={() => setOpen(true)}>
        <Ic n="search" />
      </span>
    );
  return (
    <div className="sbox sin" style={{ flex: 1, margin: "0 4px 0 8px", height: 40 }}>
      <Ic n="search" />
      <input
        autoFocus
        value={v}
        placeholder="여행 이름 · 나라 · 도시"
        onChange={(e) => {
          setV(e.target.value);
          router.replace(e.target.value ? `/?q=${encodeURIComponent(e.target.value)}` : "/");
        }}
      />
      <i
        className="sx"
        onClick={() => {
          setV("");
          setOpen(false);
          router.replace("/");
        }}
      >
        <Ic n="x" />
      </i>
    </div>
  );
}
