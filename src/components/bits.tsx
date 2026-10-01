import { MapPin } from "lucide-react";
import type { Trip } from "@/lib/types";

export function Flags({ trip, size = 16 }: { trip: Pick<Trip, "kind" | "countries" | "cities">; size?: number }) {
  if (trip.kind === "domestic") {
    if (!trip.cities.length) return null;
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-sky-s px-1.5 py-0.5 text-[11px] font-extrabold text-sky-d">
        <MapPin size={12} />
        {trip.cities.slice(0, 2).join(", ")}
        {trip.cities.length > 2 ? ` 외 ${trip.cities.length - 2}` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex gap-[3px]">
      {trip.countries.slice(0, 4).map((c) => (
        <span key={c} className={`flag fi fi-${c}`} style={{ width: size, height: (size * 3) / 4 }} />
      ))}
    </span>
  );
}

export function NamePill({ name, color }: { name: string; color: string }) {
  return (
    <span className="pill" style={{ background: color }}>
      {name}
    </span>
  );
}

/** 커버 배경 (색 또는 사진) */
export function coverStyle(trip: Pick<Trip, "cover_color" | "cover_photo">): React.CSSProperties {
  if (trip.cover_photo) return { backgroundImage: `url(${trip.cover_photo})`, backgroundSize: "cover", backgroundPosition: "center" };
  const c = trip.cover_color || "#4DA3FF";
  return { background: `linear-gradient(150deg, ${c}cc, ${c})` };
}

export function StatusTag({ s }: { s: string | null }) {
  if (!s) return null;
  const done = s === "예약 완료";
  return <span className={`rounded-md px-1.5 py-0.5 text-[11.5px] font-bold ${done ? "bg-[#E4F4EB] text-green" : "bg-[#FFF3DA] text-[#B07400]"}`}>{done ? "확정" : s}</span>;
}

