"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Ic from "@/components/Ic";
import QuickSheet from "@/components/QuickSheet";

/** 아래 탭 (목업 .nav). 목록 화면에서만 보여요 */
export default function TripNav({ id }: { id: string }) {
  const path = usePathname();
  const [quick, setQuick] = useState(false);
  const base = `/trips/${id}`;
  const rest = path.slice(base.length);
  const show = ["", "/plan", "/money", "/more", "/bookings", "/pack", "/wish", "/diary"].includes(rest) || (/^\/money\/pocket\/[^/]+$/.test(rest) && !rest.endsWith("/new"));
  if (!show) return null;
  const tab = rest === "" ? "home" : rest === "/plan" ? "plan" : rest.startsWith("/money") ? "money" : "more";
  const items = [
    { k: "home", href: base, label: "여행", n: "house" as const },
    { k: "plan", href: `${base}/plan`, label: "일정", n: "calendar-days" as const },
    { k: "money", href: `${base}/money`, label: "경비", n: "wallet" as const },
    { k: "more", href: `${base}/more`, label: "더보기", n: "layout-grid" as const },
  ];
  const link = (x: (typeof items)[number]) => (
    <Link key={x.k} href={x.href} className={tab === x.k ? "on" : ""}>
      <Ic n={x.n} />
      {x.label}
    </Link>
  );
  return (
    <>
      <div className="nav">
        {items.slice(0, 2).map(link)}
        <div className="plus" onClick={() => setQuick(true)}>
          <Ic n="plus" />
        </div>
        {items.slice(2).map(link)}
      </div>
      <QuickSheet id={id} open={quick} onClose={() => setQuick(false)} />
    </>
  );
}
