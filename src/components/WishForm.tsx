"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/places";
import { removePhotos } from "@/lib/photo";
import FormHeader from "@/components/ui/FormHeader";
import PhotoField from "@/components/ui/PhotoField";
import type { Wish } from "@/lib/types";

export default function WishForm({ tripId, wish, defaultKind, groups }: { tripId: string; wish?: Wish; defaultKind?: "place" | "shop"; groups: string[] }) {
  const router = useRouter();
  const edit = !!wish;
  const [kind, setKind] = useState<"place" | "shop">(wish?.kind ?? defaultKind ?? "place");
  const [name, setName] = useState(wish?.name ?? "");
  const [cat, setCat] = useState(wish?.category ?? "음식점");
  const [group, setGroup] = useState(wish?.shop_group ?? "");
  const [memo, setMemo] = useState(wish?.memo ?? "");
  const [address, setAddress] = useState(wish?.address ?? "");
  const [link, setLink] = useState(wish?.link ?? "");
  const [photos, setPhotos] = useState<string[]>(wish?.photos ?? []);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const back = `/trips/${tripId}/wish?tab=${kind}`;

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    const row = {
      trip_id: tripId,
      kind,
      name: name.trim(),
      category: kind === "place" ? cat : null,
      shop_group: kind === "shop" ? group.trim() || null : null,
      memo: memo.trim() || null,
      address: kind === "place" ? address.trim() || null : null,
      link: link.trim() || null,
      photos,
    };
    const supabase = createClient();
    const res = edit ? await supabase.from("wishes").update(row).eq("id", wish!.id).select("id").single() : await supabase.from("wishes").insert(row).select("id").single();
    setBusy(false);
    if (res.error) return alert("저장하지 못했어요");
    if (edit) {
      const gone = (wish!.photos || []).filter((p) => !photos.includes(p));
      if (gone.length) removePhotos(gone);
    }
    router.replace(kind === "place" ? `/trips/${tripId}/wish/${res.data.id}` : back);
    router.refresh();
  }

  async function remove() {
    if (!wish || !confirm("위시리스트에서 지울까요?")) return;
    const { error } = await createClient().from("wishes").delete().eq("id", wish.id);
    if (error) return alert("지우지 못했어요");
    removePhotos(wish.photos || []);
    router.replace(back);
    router.refresh();
  }

  return (
    <main className="pb-10">
      <FormHeader title={edit ? (kind === "place" ? "가고싶은곳 수정" : "살 것") : kind === "place" ? "가고싶은곳 추가" : "살 것 추가"} onSave={save} canSave={!!name.trim() && !uploading} busy={busy} />
      <div className="px-5">
        {!edit && (
          <div className="mt-3 flex rounded-[14px] bg-white p-1">
            {(
              [
                ["place", "가고싶은곳"],
                ["shop", "쇼핑"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} onClick={() => setKind(k)} className={`flex-1 rounded-[10px] py-2.5 text-[14.5px] font-bold ${kind === k ? "bg-char text-white" : "text-sub"}`}>
                {l}
              </button>
            ))}
          </div>
        )}

        <label className="flab">{kind === "place" ? "이름" : "뭘 살까요?"}</label>
        <input className="inp !text-[17px] font-semibold" autoFocus={!edit} value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "place" ? "예) 이치란 라멘 본점" : "예) 동전파스, 곤약젤리"} />

        {kind === "place" ? (
          <>
            <label className="flab">분류</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter((c) => c.key !== "교통").map((c) => (
                <button key={c.key} className={`chip ${cat === c.key ? "on" : ""}`} onClick={() => setCat(c.key)}>
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: c.color }} />
                  {c.key}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <label className="flab">
              어디서 살까요? <span className="font-medium text-sub">선택</span>
            </label>
            <input className="inp" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="예) 돈키호테, 드럭스토어" />
            {groups.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {groups.map((g) => (
                  <button key={g} className={`chip ${group === g ? "on" : ""}`} onClick={() => setGroup(g)}>
                    {g}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <label className="flab">
          메모 <span className="font-medium text-sub">선택</span>
        </label>
        <textarea className="inp min-h-[80px] resize-none leading-relaxed" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={kind === "place" ? "뭐 먹을지, 웨이팅, 영업시간" : "개수, 가격, 부탁받은 사람"} />

        <label className="flab">
          사진 <span className="font-medium text-sub">선택</span>
        </label>
        <PhotoField tripId={tripId} value={photos} onChange={setPhotos} onBusy={setUploading} max={kind === "place" ? 10 : 4} />

        {kind === "place" && (
          <>
            <label className="flab">
              주소 <span className="font-medium text-sub">선택</span>
            </label>
            <input className="inp" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="예) 텐진 · 주오구" />
          </>
        )}
        <label className="flab">
          링크 <span className="font-medium text-sub">선택</span>
        </label>
        <input className="inp" value={link} onChange={(e) => setLink(e.target.value)} placeholder="블로그, 지도, 인스타" inputMode="url" />

        {edit && (
          <button className="dellink w-full" onClick={remove}>
            <Trash2 size={16} /> 위시리스트에서 삭제
          </button>
        )}
      </div>
    </main>
  );
}
