"use client";

import { useState } from "react";
import Sheet from "@/components/ui/Sheet";

const HS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MS = ["00", "10", "20", "30", "40", "50"];

/** 목업 시간 창 */
export default function TimePick({ open, onClose, value, onDone }: { open: boolean; onClose: () => void; value?: string | null; onDone: (v: string) => void }) {
  const parse = (v?: string | null) => {
    const m = v?.match(/(\d{1,2}):(\d{2})/);
    const h = m ? +m[1] : 12;
    return { pm: h >= 12, h: h % 12 === 0 ? 12 : h % 12, m: m && MS.includes(m[2]) ? m[2] : "00" };
  };
  const [s, setS] = useState(parse(value));
  const [was, setWas] = useState(false);
  if (open && !was) {
    setWas(true);
    setS(parse(value));
  }
  if (!open && was) setWas(false);
  const out = `${String((s.h % 12) + (s.pm ? 12 : 0)).padStart(2, "0")}:${s.m}`;
  return (
    <Sheet open={open} onClose={onClose} title="시간" id="timePick">
      <div className="tp-big">{out}</div>
      <div className="segm" style={{ marginTop: 12 }}>
        <span className={!s.pm ? "on" : ""} onClick={() => setS({ ...s, pm: false })}>
          오전
        </span>
        <span className={s.pm ? "on" : ""} onClick={() => setS({ ...s, pm: true })}>
          오후
        </span>
      </div>
      <div className="tp-h">
        {HS.map((h) => (
          <span key={h} className={s.h === h ? "on" : ""} onClick={() => setS({ ...s, h })}>
            {h}시
          </span>
        ))}
      </div>
      <div className="tp-m">
        {MS.map((m) => (
          <span key={m} className={s.m === m ? "on" : ""} onClick={() => setS({ ...s, m })}>
            {m}분
          </span>
        ))}
      </div>
      <div className="btns2">
        <div
          onClick={() => {
            onDone("");
            onClose();
          }}
        >
          시간 없음
        </div>
        <div
          onClick={() => {
            onDone(out);
            onClose();
          }}
        >
          완료
        </div>
      </div>
    </Sheet>
  );
}
