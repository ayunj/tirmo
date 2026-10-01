"use client";

import { Fragment, useMemo, useState } from "react";
import { parseDate, timeSort } from "@/lib/format";
import Ic from "@/components/Ic";
import Sheet from "@/components/ui/Sheet";

export type DayEv = { id: string; day: string | null; time_text: string | null; sort: number; title: string };

/** 일정에 넣기 창 (목업 planPick): 날짜 · 시간 · 순서 */
export default function PlanPick({
  open,
  onClose,
  title,
  sub,
  days,
  events,
  defaultDay,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  days: string[];
  events: DayEv[];
  defaultDay?: string;
  onDone: (day: string | null, time: string, sort: number) => void;
}) {
  const [day, setDay] = useState(defaultDay ?? days[0] ?? "none");
  const [time, setTime] = useState("");
  const [slot, setSlot] = useState<number | null>(null);
  const list = useMemo(() => events.filter((e) => (day === "none" ? !e.day : e.day === day)).sort((a, b) => a.sort - b.sort), [events, day]);
  const auto = useMemo(() => {
    if (!time.trim()) return list.length;
    const i = list.findIndex((e) => e.sort > timeSort(time));
    return i < 0 ? list.length : i;
  }, [list, time]);
  const at = slot ?? auto;
  const sortAt = () => {
    if (slot == null && time.trim()) return timeSort(time) + Math.random() / 10;
    const a = list[at - 1]?.sort;
    const b = list[at]?.sort;
    return a == null && b == null ? timeSort(time) : a == null ? b! - 1 : b == null ? a + 1 : (a + b) / 2;
  };
  return (
    <Sheet open={open} onClose={onClose} title={<div><b style={{ fontSize: 17 }} id="ppT">{title}</b>{sub && <div className="sub" id="ppS">{sub}</div>}</div>} id="planPick">
      <label className="flab" style={{ marginTop: 14 }}>
        날짜
      </label>
      <div className="dcks">
        {days.map((d, i) => (
          <div key={d} className={`dck${day === d ? " on" : ""}`} onClick={() => (setDay(d), setSlot(null))}>
            <span>DAY {i + 1}</span>
            <b>
              {parseDate(d).getMonth() + 1}/{parseDate(d).getDate()}
            </b>
          </div>
        ))}
        <div className={`dck${day === "none" ? " on" : ""}`} onClick={() => (setDay("none"), setSlot(null))}>
          <span>날짜</span>
          <b>미정</b>
        </div>
      </div>
      <label className="flab">
        시간{" "}
        <span className="sub" style={{ fontWeight: 500 }}>
          선택
        </span>
      </label>
      <div className="inp row tin tinput">
        <Ic n="clock-3" />
        <input className="tedit" value={time} onChange={(e) => (setTime(e.target.value), setSlot(null))} placeholder="예) 21:00" style={{ flex: 1, border: 0, outline: 0, background: "none" }} />
      </div>
      {list.length > 0 && (
        <>
          <label className="flab">순서</label>
          <div className="wlist">
            {Array.from({ length: list.length + 1 }).map((_, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <div className={`wslot${at === i ? " on" : ""}`} onClick={() => setSlot(i)}>
                    <i className="ck" />
                    <span className="wh">여기에 넣기</span>
                    <span className="wn">{title}</span>
                    {at === i && (
                      <i className="grip">
                        <Ic n="grip-vertical" />
                      </i>
                    )}
                  </div>
                )}
                {list[i] && (
                  <div className="wl">
                    <span className="t">{list[i].time_text}</span>
                    <b>{list[i].title}</b>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </>
      )}
      <div
        className="bigbtn"
        onClick={() => {
          onDone(day === "none" ? null : day, time.trim(), sortAt());
          onClose();
        }}
      >
        일정에 넣기
      </div>
    </Sheet>
  );
}
