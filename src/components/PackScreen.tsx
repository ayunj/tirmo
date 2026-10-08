"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PACK_CATS, PACK_IC, PACK_TEMPLATE } from "@/lib/pack";
import { askDel, toast } from "@/lib/ui";
import Go from "@/components/Go";
import TripTitle from "@/components/TripTitle";
import Ic from "@/components/Ic";
import Sheet from "@/components/ui/Sheet";
import type { PackItem } from "@/lib/types";

type Who = { id: string; nickname: string; color: string };
type Props = { tripId: string; head: { title: string; start_date: string | null; end_date: string | null }; items: PackItem[]; members: Who[]; me: string; dleft: string; prev: { title: string; items: { name: string; category: string }[] } | null };

/** 준비물 (목업 pack + packItem 창) */
export default function PackScreen({ tripId, head, items, members, me, dleft, prev }: Props) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [was, setWas] = useState(items);
  if (items !== was) {
    setWas(items);
    setList(items);
  }
  const [filt, setFilt] = useState("");
  const [sheet, setSheet] = useState<null | { it?: PackItem }>(null);
  const [name, setName] = useState("");
  const [cat, setCat] = useState("");
  const [newCat, setNewCat] = useState("");
  const [shared, setShared] = useState(false);
  const [pin, setPin] = useState(false);
  const [busy, setBusy] = useState(false);

  const used = Array.from(new Set(list.map((i) => i.category)));
  const cats = [...PACK_CATS.filter((c) => used.includes(c)), ...used.filter((c) => !PACK_CATS.includes(c))];
  const done = list.filter((i) => i.done).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;

  function open(it?: PackItem) {
    setSheet({ it });
    setName(it?.name ?? "");
    setCat(it?.category ?? (filt || cats[0] || "필수"));
    setNewCat("");
    setShared(it ? !it.assignee : false);
    setPin(it?.pinned ?? false);
  }

  async function toggle(it: PackItem) {
    setList((l) => l.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)));
    const { error } = await createClient().from("pack_items").update({ done: !it.done }).eq("id", it.id);
    if (error) {
      toast("저장하지 못했어요");
      router.refresh();
    }
  }

  async function save() {
    if (!name.trim()) return toast("이름을 적어 주세요");
    const category = cat === "__new" ? newCat.trim() : cat;
    if (!category) return toast("카테고리 이름을 적어 주세요");
    setBusy(true);
    const row = { trip_id: tripId, name: name.trim(), category, assignee: shared ? null : me, pinned: pin };
    const supabase = createClient();
    const it = sheet?.it;
    const { error } = it ? await supabase.from("pack_items").update(row).eq("id", it.id) : await supabase.from("pack_items").insert({ ...row, sort: Date.now() / 1e10 });
    setBusy(false);
    if (error) return toast("저장하지 못했어요");
    setSheet(null);
    toast(it ? "고쳤어요" : `${category}에 넣었어요`);
    if (filt && filt !== category) setFilt(category);
    router.refresh();
  }

  async function remove() {
    const it = sheet?.it;
    if (!it || !(await askDel("이 준비물을 뺄까요?", undefined, "빼기"))) return;
    const { error } = await createClient().from("pack_items").delete().eq("id", it.id);
    if (error) return toast("지우지 못했어요");
    setSheet(null);
    toast("뺐어요");
    router.refresh();
  }

  async function bulk(rows: { name: string; category: string }[], msg: string) {
    const have = new Set(list.map((i) => `${i.category}|${i.name}`));
    const add = rows.filter((r) => !have.has(`${r.category}|${r.name}`)).map((r, i) => ({ trip_id: tripId, name: r.name, category: r.category, assignee: me, sort: i }));
    if (!add.length) return toast("이미 다 있어요");
    const { error } = await createClient().from("pack_items").insert(add);
    if (error) return toast("넣지 못했어요");
    toast(`${add.length}개 ${msg}`);
    router.refresh();
  }

  return (
    <section className="screen on" id="pack">
      <div className="scr">
        <div className="hd">
          <TripTitle id={tripId} title={head.title} start={head.start_date} end={head.end_date} label="준비물" />
          <span className="ib" id="packPlus" onClick={() => open()}>
            <Ic n="plus" />
          </span>
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          <div className="packsum">
            <div className="ring big" style={{ "--p": pct } as React.CSSProperties}>
              {pct}%
            </div>
            <div>
              <b>{list.length ? `${done}개 챙겼어요` : "내 준비물을 적어 봐요"}</b>
              <div className="sub">{[list.length ? `${list.length - done}개 남음` : "", dleft].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
          {cats.length > 0 && (
            <div className="chips flush" id="pkF">
              <span className={`chip${!filt ? " on" : ""}`} onClick={() => setFilt("")}>
                전체
              </span>
              {cats.map((c) => (
                <span key={c} className={`chip${filt === c ? " on" : ""}`} onClick={() => setFilt(c)}>
                  {c}
                </span>
              ))}
            </div>
          )}
          {cats
            .filter((c) => !filt || c === filt)
            .map((c) => {
              const rows = list.filter((i) => i.category === c).sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.sort - b.sort);
              return (
                <div key={c} className="pgc">
                  <div className="pg-h">
                    <Ic n={PACK_IC[c] ?? "luggage"} />
                    <b>{c}</b>
                    <span>
                      {rows.filter((r) => r.done).length} / {rows.length}
                    </span>
                  </div>
                  {rows.map((it) => (
                    <div key={it.id} className={`pi${it.done ? " done" : ""}`} onClick={() => open(it)}>
                      <i
                        className="ck"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(it);
                        }}
                      />
                      <span className="pn">{it.name}</span>
                      {it.booking_id && (
                        <Go
                          as="span"
                          className="tag blue"
                          href={`/trips/${tripId}/bookings/${it.booking_id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Ic n="link" /> 예약
                        </Go>
                      )}
                      {!it.assignee && members.length > 1 && <span className="pshared">다 같이</span>}
                      {it.pinned && (
                        <span className="pin">
                          <Ic n="pin" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          <div className="addline" id="packAdd" onClick={() => open()}>
            <Ic n="plus" /> 준비물 추가
          </div>
          {prev && prev.items.length > 0 ? (
            <div className="addline" onClick={() => bulk(prev.items, "불러왔어요")}>
              <Ic n="copy" /> 지난 여행 준비물 불러오기
            </div>
          ) : (
            list.length === 0 && (
              <div className="addline" onClick={() => bulk(Object.entries(PACK_TEMPLATE).flatMap(([category, ns]) => ns.map((n) => ({ name: n, category }))), "넣었어요")}>
                <Ic n="copy" /> 기본 목록 불러오기
              </div>
            )
          )}
        </div>
      </div>

      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet?.it ? "준비물 수정" : "준비물 추가"} id="packItem">
        <label className="flab">이름</label>
        <input className="inp wi-f" autoFocus={!sheet?.it} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && save()} placeholder="예) 상비약, 셀카봉" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 15px" }} />
        <label className="flab">카테고리</label>
        <div className="chips flush pi-c" style={{ marginTop: 0, flexWrap: "wrap" }}>
          {Array.from(new Set([...cats, ...PACK_CATS])).map((c) => (
            <span key={c} className={`chip${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>
              {c}
            </span>
          ))}
          <span className={`chip${cat === "__new" ? " on" : ""}`} onClick={() => setCat("__new")}>
            ＋ 새 카테고리
          </span>
        </div>
        {cat === "__new" && <input className="inp" autoFocus value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="새 카테고리 이름" style={{ marginTop: 8, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 15px" }} />}
        <div className="switches" style={{ marginTop: 14 }}>
          <div id="piPin" onClick={() => setPin(!pin)}>
            <Ic n="pin" />
            <span>꼭 챙길 것 (맨 위에 고정)</span>
            <i className={`sw${pin ? " on" : ""}`} />
          </div>
          {members.length > 1 && (
            <div id="piShared" onClick={() => setShared(!shared)}>
              <Ic n="users" />
              <span>다 같이 챙길 것 (모두에게 보여요)</span>
              <i className={`sw${shared ? " on" : ""}`} />
            </div>
          )}
        </div>
        <div className="btns2" id="piBtns">
          <div onClick={() => !busy && save()}>{sheet?.it ? "저장" : "추가"}</div>
          {sheet?.it && (
            <div className="del" onClick={remove}>
              <Ic n="trash" />
            </div>
          )}
        </div>
      </Sheet>
    </section>
  );
}
