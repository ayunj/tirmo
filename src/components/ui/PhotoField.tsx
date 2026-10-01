"use client";

import { useRef, useState } from "react";
import { uploadPhoto } from "@/lib/photo";
import { toast } from "@/lib/ui";
import Ic from "@/components/Ic";

/** 사진 여러 장 올리기 (목업 .wphotos 모양) */
export default function PhotoField({ tripId, value, onChange, max = 10, onBusy, label = "추가" }: { tripId: string; value: string[]; onChange: (v: string[]) => void; max?: number; onBusy?: (b: boolean) => void; label?: string }) {
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
        toast("사진을 올리지 못했어요");
      }
      setN((x) => x - 1);
    }
    onBusy?.(false);
    if (ref.current) ref.current.value = "";
  }
  return (
    <div className="wphotos">
      {value.map((u, i) => (
        <div key={u}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="im" src={u} alt="" />
          <b className="wx-x" onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Ic n="x" />
          </b>
        </div>
      ))}
      {Array.from({ length: n }).map((_, i) => (
        <div key={`l${i}`} className="add">
          <Ic n="clock-3" />
          <span>올리는 중</span>
        </div>
      ))}
      {value.length + n < max && (
        <div className="add" onClick={() => ref.current?.click()}>
          <Ic n="camera" />
          <span>{label}</span>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" multiple={max > 1} hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}
