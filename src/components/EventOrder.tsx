"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { evCat } from "@/lib/cats";
import { normTime, parseTime } from "@/lib/format";
import { toast } from "@/lib/ui";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import SaveBar from "@/components/ui/SaveBar";
import type { EventRow } from "@/lib/types";

type Ev = Pick<EventRow, "id" | "time_text" | "sort" | "title" | "category">;

/** 정해진 순서대로 정렬값 다시 매기기. 시간이 있는 일정은 시간이 곧 자리라 그대로 두고, 그 사이에 시간 없는 일정을 고르게 끼워 넣어요 */
function resort(list: Ev[]) {
  const out: { id: string; sort: number }[] = [];
  let i = 0;
  while (i < list.length) {
    if (parseTime(list[i].time_text) != null) {
      i++;
      continue;
    }
    let j = i;
    while (j < list.length && parseTime(list[j].time_text) == null) j++;
    const lo = i > 0 ? parseTime(list[i - 1].time_text)! : null;
    const hi = j < list.length ? parseTime(list[j].time_text)! : null;
    const n = j - i;
    for (let k = 0; k < n; k++) {
      const v = lo != null && hi != null ? lo + ((hi - lo) * (k + 1)) / (n + 1) : lo != null ? lo + (k + 1) * 10 : hi != null ? hi - (n - k) * 10 : 1000 + k * 10;
      out.push({ id: list[i + k].id, sort: v });
    }
    i = j;
  }
  return out;
}

/** 일정 순서 바꾸기: 손잡이를 끌어서 자리를 옮겨요 */
export default function EventOrder({ tripId, day, title, events }: { tripId: string; day: string; title: string; events: Ev[] }) {
  const router = useRouter();
  const [list, setList] = useState(events);
  const [drag, setDrag] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = useRef<Record<string, HTMLDivElement | null>>({});
  const changed = list.some((e, i) => e.id !== events[i]?.id);

  function down(e: React.PointerEvent, id: string) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag(id);
  }
  function move(e: React.PointerEvent) {
    if (!drag) return;
    const y = e.clientY;
    setList((cur) => {
      const from = cur.findIndex((x) => x.id === drag);
      // 손가락 위치보다 가운데가 위에 있는 줄 수 = 들어갈 자리
      let to = 0;
      cur.forEach((x) => {
        if (x.id === drag) return;
        const r = rows.current[x.id]?.getBoundingClientRect();
        if (r && y > r.top + r.height / 2) to++;
      });
      if (to === from) return cur;
      const next = cur.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  }
  function up() {
    setDrag(null);
  }

  async function save() {
    // 시간이 있는 일정끼리 순서가 뒤집히면 저장해도 시간대로 돌아가요
    const timed = list.map((e) => parseTime(e.time_text)).filter((v): v is number => v != null);
    if (timed.some((v, i) => i > 0 && v < timed[i - 1])) return toast("시간이 정해진 일정은 시간 순서대로 놓아 주세요");
    setBusy(true);
    const supabase = createClient();
    const upd = resort(list).filter((u) => Number(events.find((e) => e.id === u.id)?.sort) !== u.sort);
    const res = await Promise.all(upd.map((u) => supabase.from("events").update({ sort: u.sort }).eq("id", u.id)));
    setBusy(false);
    if (res.some((r) => r.error)) return toast("저장하지 못했어요");
    toast("순서를 바꿨어요");
    router.replace(`/trips/${tripId}/plan?day=${day}`);
    router.refresh();
  }

  return (
    <section className="screen on hasbar" id="eventOrder">
      <div className="scr nonav">
        <div className="hd">
          <Go as="span" className="ib" back>
            <Ic n="x" />
          </Go>
          <h2>일정 순서 변경</h2>
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          <div className="sub" style={{ margin: "-4px 2px 10px" }}>
            {title}
          </div>
          <div className={`olist${drag ? " dragging" : ""}`} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            {list.map((e, i) => {
              const c = evCat(e.category);
              return (
                <div key={e.id} ref={(el) => void (rows.current[e.id] = el)} className={`orow${drag === e.id ? " on" : ""}`}>
                  <span className="on-n">{i + 1}</span>
                  <span className={`evi ${c.evi} sm`}>
                    <Ic n={c.ic} />
                  </span>
                  <div className="mid">
                    <b>{e.title}</b>
                    {e.time_text && <div className="s">{normTime(e.time_text)}</div>}
                  </div>
                  <i className="grip" onPointerDown={(ev) => down(ev, e.id)} aria-label="끌어서 옮기기">
                    <Ic n="grip-vertical" />
                  </i>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <SaveBar on={changed} busy={busy} onSave={save} />
    </section>
  );
}
