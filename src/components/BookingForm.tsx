"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BOOKING_FIELDS, BOOKING_KINDS, STATUSES, sortKey } from "@/lib/booking";
import { removePhotos } from "@/lib/photo";
import { sym } from "@/lib/money";
import { BookingIcon } from "@/components/icons";
import FormHeader from "@/components/ui/FormHeader";
import PhotoField from "@/components/ui/PhotoField";
import type { Booking, BookingKind } from "@/lib/types";

const EXP_CAT: Record<BookingKind, string> = { flight: "항공", hotel: "숙소", car: "교통", restaurant: "식비", tour: "관광", etc: "기타" };

type Props = {
  tripId: string;
  tripCurrency: string;
  memberIds: string[];
  me: string;
  booking?: Booking;
  defaultKind?: BookingKind;
};

export default function BookingForm({ tripId, tripCurrency, memberIds, me, booking, defaultKind }: Props) {
  const router = useRouter();
  const edit = !!booking;
  const [kind, setKind] = useState<BookingKind>(booking?.kind ?? defaultKind ?? "flight");
  const [title, setTitle] = useState(booking?.title ?? "");
  const [d, setD] = useState<Record<string, string>>(booking?.details ?? {});
  const [status, setStatus] = useState(booking?.status ?? "예약 완료");
  const [amount, setAmount] = useState(booking?.amount != null ? String(booking.amount) : "");
  const [cur, setCur] = useState(booking?.currency ?? "KRW");
  const [pay, setPay] = useState(booking?.details?.pay ?? "결제 완료");
  const [memo, setMemo] = useState(booking?.memo ?? "");
  const [link, setLink] = useState(booking?.link ?? "");
  const [photos, setPhotos] = useState<string[]>(booking?.photos ?? []);
  const [toMoney, setToMoney] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fields = BOOKING_FIELDS[kind];
  const flightName = [d.airline, d.flight_no].filter(Boolean).join(" ");
  const canSave = kind === "flight" ? !!(d.from || d.to || flightName) : !!title.trim();
  const curs = Array.from(new Set(["KRW", tripCurrency]));
  const amt = Number(amount.replace(/,/g, ""));

  async function save() {
    setBusy(true);
    const supabase = createClient();
    const details = { ...d, pay };
    const row = {
      trip_id: tripId,
      kind,
      title: kind === "flight" ? flightName || "항공권" : title.trim(),
      status,
      details,
      amount: amount ? amt : null,
      currency: amount ? cur : null,
      memo: memo.trim() || null,
      link: link.trim() || null,
      photos,
      sort_key: sortKey({ kind, details }),
    };
    let id = booking?.id;
    if (edit) {
      const { error } = await supabase.from("bookings").update(row).eq("id", id!);
      if (error) return fail();
      const gone = (booking!.photos || []).filter((p) => !photos.includes(p));
      if (gone.length) removePhotos(gone);
    } else {
      const { data, error } = await supabase.from("bookings").insert(row).select("id").single();
      if (error || !data) return fail();
      id = data.id;
      if (toMoney && amount && amt > 0) {
        await supabase.from("expenses").insert({
          trip_id: tripId,
          payer_id: me,
          amount: amt,
          currency: cur,
          category: EXP_CAT[kind],
          title: row.title,
          day: null,
          split: { members: memberIds },
          booking_id: id,
        });
      }
    }
    router.replace(`/trips/${tripId}/bookings/${id}`);
    router.refresh();
  }

  function fail() {
    setBusy(false);
    alert("저장하지 못했어요");
  }

  async function remove() {
    if (!booking || !confirm("이 예약을 지울까요?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("bookings").delete().eq("id", booking.id);
    if (error) return alert("지우지 못했어요");
    removePhotos(booking.photos || []);
    router.replace(`/trips/${tripId}/bookings`);
    router.refresh();
  }

  return (
    <main className="pb-10">
      <FormHeader title={edit ? "예약 수정" : "예약 추가"} onSave={save} canSave={canSave && !uploading} busy={busy} />
      <div className="px-5 pt-1">
        <div className="mt-3 grid grid-cols-3 gap-2">
          {BOOKING_KINDS.map((k) => (
            <button
              key={k.key}
              onClick={() => setKind(k.key)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-[1.5px] bg-white py-3.5 text-[13px] font-bold ${kind === k.key ? "border-char text-ink" : "border-line text-ink2"}`}
            >
              <BookingIcon kind={k.key} />
              {k.label}
            </button>
          ))}
        </div>

        {kind !== "flight" && (
          <>
            <label className="flab">이름</label>
            <input className="inp !text-[17px] font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "hotel" ? "숙소 이름" : kind === "car" ? "차종 · 예) 야리스 오토" : "어디예요?"} />
          </>
        )}

        <div className="grid grid-cols-2 gap-x-2">
          {fields.map((f) => (
            <div key={f.key} className={f.half ? "" : "col-span-2"}>
              <label className="flab">{f.label}</label>
              <input
                className="inp"
                type={f.type === "date" ? "date" : "text"}
                inputMode={f.type === "time" ? "numeric" : f.type === "tel" ? "tel" : undefined}
                value={d[f.key] ?? ""}
                placeholder={f.ph ?? (f.type === "time" ? "00:00" : "")}
                onChange={(e) => setD({ ...d, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <label className="flab">상태</label>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button key={s} className={`chip ${status === s ? "on" : ""}`} onClick={() => setStatus(s)}>
              {s}
            </button>
          ))}
        </div>

        <label className="flab">
          금액 <span className="font-medium text-sub">선택</span>
        </label>
        <div className="flex gap-2">
          <div className="flex flex-none rounded-[14px] border-[1.5px] border-line bg-white p-1">
            {curs.map((c) => (
              <button key={c} onClick={() => setCur(c)} className={`rounded-[10px] px-3 text-sm font-bold ${cur === c ? "bg-char text-white" : "text-sub"}`}>
                {sym(c).trim()}
              </button>
            ))}
          </div>
          <input className="inp" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0" />
        </div>
        {amount && (
          <div className="mt-2 flex gap-1.5">
            {["결제 완료", "현장결제"].map((p) => (
              <button key={p} className={`chip ${pay === p ? "on" : ""}`} onClick={() => setPay(p)}>
                {p}
              </button>
            ))}
          </div>
        )}
        {!edit && amount && amt > 0 && (
          <label className="mt-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-[14.5px]">
            경비 내역에도 넣기 <span className="s13 ml-1 flex-1">· 내가 내고 다 같이 나눠요</span>
            <input type="checkbox" className="h-5 w-5 accent-[#4B4E56]" checked={toMoney} onChange={(e) => setToMoney(e.target.checked)} />
          </label>
        )}

        <label className="flab">
          캡처 · 바우처 <span className="font-medium text-sub">선택</span>
        </label>
        <PhotoField tripId={tripId} value={photos} onChange={setPhotos} onBusy={setUploading} label={kind === "flight" ? "탑승권" : "캡처"} />

        <label className="flab">
          메모 · 링크 <span className="font-medium text-sub">선택</span>
        </label>
        <textarea className="inp min-h-[80px] resize-none leading-relaxed" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="취소 규정, 준비할 것" />
        <input className="inp mt-2" value={link} onChange={(e) => setLink(e.target.value)} placeholder="예약 확인 페이지 링크" inputMode="url" />

        {edit && (
          <button className="dellink w-full" onClick={remove}>
            <Trash2 size={16} /> 예약 삭제
          </button>
        )}
      </div>
    </main>
  );
}
