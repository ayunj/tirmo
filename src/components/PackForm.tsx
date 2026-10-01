"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PACK_CATS } from "@/lib/pack";
import FormHeader from "@/components/ui/FormHeader";
import type { PackItem } from "@/lib/types";

type Props = {
  tripId: string;
  item?: PackItem;
  defaultCat?: string;
  cats: string[];
  members: { id: string; nickname: string; color: string }[];
  bookings: { id: string; title: string }[];
};

export default function PackForm({ tripId, item, defaultCat, cats, members, bookings }: Props) {
  const router = useRouter();
  const edit = !!item;
  const all = Array.from(new Set([...PACK_CATS, ...cats]));
  const [name, setName] = useState(item?.name ?? "");
  const [cat, setCat] = useState(item?.category ?? defaultCat ?? "필수");
  const [custom, setCustom] = useState("");
  const [assignee, setAssignee] = useState(item?.assignee ?? "");
  const [bookingId, setBookingId] = useState(item?.booking_id ?? "");
  const [memo, setMemo] = useState(item?.memo ?? "");
  const [busy, setBusy] = useState(false);
  const back = `/trips/${tripId}/pack`;

  async function save(again = false) {
    if (!name.trim()) return;
    setBusy(true);
    const category = cat === "__new" ? custom.trim() || "기타" : cat;
    const row = { trip_id: tripId, name: name.trim(), category, assignee: assignee || null, booking_id: bookingId || null, memo: memo.trim() || null };
    const supabase = createClient();
    const { error } = edit ? await supabase.from("pack_items").update(row).eq("id", item!.id) : await supabase.from("pack_items").insert({ ...row, sort: Date.now() / 1e10 });
    setBusy(false);
    if (error) return alert("저장하지 못했어요");
    if (again) {
      setName("");
      setMemo("");
      router.refresh();
      return;
    }
    router.replace(back);
    router.refresh();
  }

  async function remove() {
    if (!item || !confirm("이 준비물을 지울까요?")) return;
    const { error } = await createClient().from("pack_items").delete().eq("id", item.id);
    if (error) return alert("지우지 못했어요");
    router.replace(back);
    router.refresh();
  }

  return (
    <main className="pb-10">
      <FormHeader title={edit ? "준비물" : "준비물 추가"} onSave={() => save()} canSave={!!name.trim()} busy={busy} />
      <div className="px-5">
        <label className="flab">이름</label>
        <input
          className="inp !text-[17px] font-semibold"
          autoFocus={!edit}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !edit && !e.nativeEvent.isComposing && save(true)}
          placeholder="예) 여권, 우산"
        />

        <label className="flab">분류</label>
        <div className="flex flex-wrap gap-1.5">
          {all.map((c) => (
            <button key={c} className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
          <button className={`chip ${cat === "__new" ? "on" : ""}`} onClick={() => setCat("__new")}>
            + 새 분류
          </button>
        </div>
        {cat === "__new" && <input className="inp mt-2" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="예) 아기용품" autoFocus />}

        {members.length > 1 && (
          <>
            <label className="flab">
              누가 챙겨요? <span className="font-medium text-sub">선택</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button className={`chip ${!assignee ? "on" : ""}`} onClick={() => setAssignee("")}>
                다 같이
              </button>
              {members.map((m) => (
                <button key={m.id} className={`chip ${assignee === m.id ? "on" : ""}`} onClick={() => setAssignee(m.id)}>
                  {m.nickname}
                </button>
              ))}
            </div>
          </>
        )}

        <label className="flab">
          메모 <span className="font-medium text-sub">선택</span>
        </label>
        <input className="inp" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예) 3만엔, 큰 사이즈" />

        {bookings.length > 0 && (
          <>
            <label className="flab">
              예약 연결 <span className="font-medium text-sub">선택</span>
            </label>
            <select className="inp appearance-none" value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
              <option value="">연결 안 함</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </>
        )}

        {!edit && (
          <button className="btn-sub mt-6 !py-3.5 !text-[15px]" disabled={!name.trim() || busy} onClick={() => save(true)}>
            저장하고 하나 더
          </button>
        )}
        {edit && (
          <button className="dellink w-full" onClick={remove}>
            <Trash2 size={16} /> 준비물 삭제
          </button>
        )}
      </div>
    </main>
  );
}
