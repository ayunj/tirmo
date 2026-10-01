"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Wish } from "@/lib/types";

export default function ShopList({ tripId, items }: { tripId: string; items: Wish[] }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [prev, setPrev] = useState(items);
  if (items !== prev) {
    setPrev(items);
    setList(items);
  }
  const groups = Array.from(new Set(list.map((w) => w.shop_group || "")));
  groups.sort((a, b) => (a === "" ? 1 : b === "" ? -1 : 0));

  async function toggle(w: Wish) {
    const status = w.status === "done" ? null : "done";
    setList((l) => l.map((x) => (x.id === w.id ? { ...x, status } : x)));
    const { error } = await createClient().from("wishes").update({ status }).eq("id", w.id);
    if (error) {
      alert("저장하지 못했어요");
      router.refresh();
    }
  }

  return (
    <>
      {groups.map((g) => {
        const rows = list.filter((w) => (w.shop_group || "") === g);
        return (
          <section key={g || "_"} className="card mt-3 px-4 pb-1 pt-3.5">
            <div className="flex items-center justify-between pb-1">
              <b className="text-[16px]">{g || "어디서든"}</b>
              <span className="text-[12.5px] font-bold text-sub">
                {rows.filter((r) => r.status === "done").length} / {rows.length}
              </span>
            </div>
            {rows.map((w) => (
              <div key={w.id} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
                <button
                  onClick={() => toggle(w)}
                  aria-label={w.status === "done" ? "안 샀음으로" : "샀어요"}
                  className={`grid h-[22px] w-[22px] flex-none place-items-center rounded-md border-[1.5px] ${w.status === "done" ? "border-char bg-char text-white" : "border-[#c6cad1] bg-white"}`}
                >
                  {w.status === "done" && <Check size={15} strokeWidth={3} />}
                </button>
                <Link href={`/trips/${tripId}/wish/${w.id}/edit`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[15px] ${w.status === "done" ? "text-sub line-through" : ""}`}>{w.name}</span>
                    {w.memo && <span className="block truncate text-[12.5px] text-sub">{w.memo}</span>}
                  </span>
                  {w.photos?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.photos[0]} alt="" className="h-11 w-11 flex-none rounded-lg object-cover" />
                  )}
                </Link>
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}
