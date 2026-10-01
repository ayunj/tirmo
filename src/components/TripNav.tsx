"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, LayoutGrid, CirclePlus, Wallet } from "lucide-react";

export default function TripNav({ id }: { id: string }) {
  const path = usePathname();
  const base = `/trips/${id}`;
  const items = [
    { href: base, label: "여행", icon: House, on: path === base },
    { href: `${base}/plan`, label: "일정", icon: CalendarDays, on: path.startsWith(`${base}/plan`) },
    { href: `${base}/plan/new`, label: "추가", icon: CirclePlus, on: false },
    { href: `${base}/money`, label: "경비", icon: Wallet, on: path.startsWith(`${base}/money`) },
    { href: `${base}/more`, label: "더보기", icon: LayoutGrid, on: path.startsWith(`${base}/more`) || path.startsWith(`${base}/invite`) },
  ];
  // 입력 화면에서는 숨겨요
  if (/\/plan\/(new|[^/]+)$/.test(path) || path.endsWith("/edit")) return null;
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-[480px] -translate-x-1/2 justify-around border-t border-line bg-white pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5">
      {items.map(({ href, label, icon: Icon, on }) => (
        <Link key={label} href={href} className={`flex w-14 flex-col items-center gap-1 text-[11px] font-semibold ${on ? "text-ink" : "text-sub2"}`}>
          <Icon size={23} strokeWidth={on ? 2.2 : 1.8} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
