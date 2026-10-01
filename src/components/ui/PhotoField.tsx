"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { uploadPhoto } from "@/lib/photo";

/** 사진 여러 장 올리기. 올리는 중엔 onBusy(true) */
export default function PhotoField({
  tripId,
  value,
  onChange,
  max = 10,
  onBusy,
  label = "추가",
}: {
  tripId: string;
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  onBusy?: (b: boolean) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [n, setN] = useState(0);

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, max - value.length);
    setN(list.length);
    onBusy?.(true);
    const out = [...value];
    for (const f of list) {
      try {
        out.push(await uploadPhoto(tripId, f));
        onChange([...out]);
      } catch {
        alert("사진을 올리지 못했어요");
      }
      setN((x) => x - 1);
    }
    onBusy?.(false);
    if (ref.current) ref.current.value = "";
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {value.map((u, i) => (
        <div key={u} className="relative aspect-square overflow-hidden rounded-xl bg-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={u} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            aria-label="사진 빼기"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      {Array.from({ length: n }).map((_, i) => (
        <div key={`l${i}`} className="grid aspect-square animate-pulse place-items-center rounded-xl bg-line text-xs text-sub">
          올리는 중
        </div>
      ))}
      {value.length + n < max && (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-[#c6cad1] bg-white text-xs font-semibold text-sub"
        >
          <Camera size={20} />
          {label}
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" multiple={max > 1} hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}
