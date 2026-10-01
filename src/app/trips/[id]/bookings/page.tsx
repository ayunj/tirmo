import Link from "next/link";
import { ChevronLeft, ChevronRight, Plane, Plus } from "lucide-react";
import { loadTrip } from "@/lib/trip";
import { BOOKING_KINDS, between, bookingTitle, nights, when } from "@/lib/booking";
import { md, parseDate, weekday } from "@/lib/format";
import { money, sym } from "@/lib/money";
import { BookingIcon } from "@/components/icons";
import LiveRefresh from "@/components/LiveRefresh";
import { StatusTag } from "@/components/bits";
import type { Booking } from "@/lib/types";

function FlightCard({ b, tid }: { b: Booking; tid: string }) {
  const d = b.details;
  const date = d.date ? parseDate(d.date) : null;
  return (
    <Link href={`/trips/${tid}/bookings/${b.id}`} className="card flex overflow-hidden">
      <div className="min-w-0 flex-1 px-4 py-3.5">
        <div className="truncate text-[12.5px] font-semibold text-sub">{[d.airline, d.flight_no].filter(Boolean).join(" · ") || "항공권"}</div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="min-w-0">
            <b className="block truncate text-[21px] font-extrabold tracking-tight">{d.from || "출발"}</b>
            <span className="text-[12.5px] font-semibold text-ink2">{d.from_time}</span>
          </div>
          <div className="flex flex-1 flex-col items-center text-sky">
            <div className="flex w-full items-center">
              <span className="flex-1 border-t border-dashed border-sub2" />
              <Plane size={16} className="mx-1" />
              <span className="flex-1 border-t border-dashed border-sub2" />
            </div>
            <span className="mt-0.5 text-[11px] text-sub">{between(d.from_time, d.to_time)}</span>
          </div>
          <div className="min-w-0 text-right">
            <b className="block truncate text-[21px] font-extrabold tracking-tight">{d.to || "도착"}</b>
            <span className="text-[12.5px] font-semibold text-ink2">{d.to_time}</span>
          </div>
        </div>
      </div>
      <div className="flex w-[70px] flex-none flex-col items-center justify-center border-l border-dashed border-line">
        {date ? (
          <>
            <span className="text-[11px] text-sub">{date.getMonth() + 1}월</span>
            <b className="text-[24px] font-extrabold leading-tight">{date.getDate()}</b>
            <span className="text-[11px] text-sub">{weekday(d.date)}요일</span>
          </>
        ) : (
          <span className="text-xs text-sub">날짜 미정</span>
        )}
      </div>
    </Link>
  );
}

function HotelCard({ b, tid }: { b: Booking; tid: string }) {
  const d = b.details;
  const n = nights(d.checkin, d.checkout);
  return (
    <Link href={`/trips/${tid}/bookings/${b.id}`} className="card block overflow-hidden">
      {b.photos?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.photos[0]} alt="" className="h-[120px] w-full object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start gap-2">
          <b className="flex-1 text-[16.5px] font-bold leading-snug">{b.title}</b>
          <StatusTag s={b.status} />
        </div>
        <div className="mt-3 flex items-center rounded-xl bg-bg px-3.5 py-2.5">
          <div className="flex-1">
            <span className="block text-[11.5px] text-sub">체크인</span>
            <b className="text-[14px]">
              {d.checkin ? md(d.checkin) : "-"} {d.checkin_time}
            </b>
          </div>
          <span className="px-2 text-[12px] font-bold text-sub">{n > 0 ? `${n}박` : <ChevronRight size={16} />}</span>
          <div className="flex-1 text-right">
            <span className="block text-[11.5px] text-sub">체크아웃</span>
            <b className="text-[14px]">
              {d.checkout ? md(d.checkout) : "-"} {d.checkout_time}
            </b>
          </div>
        </div>
        {(d.room || b.amount != null) && (
          <div className="mt-2.5 flex justify-between text-[13px]">
            <span className="text-sub">{d.room}</span>
            {b.amount != null && (
              <b>
                {money(Number(b.amount), sym(b.currency || "KRW"))} {d.pay === "현장결제" ? "현장결제" : ""}
              </b>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function RowCard({ b, tid }: { b: Booking; tid: string }) {
  const w = when(b);
  return (
    <Link href={`/trips/${tid}/bookings/${b.id}`} className="card flex items-center gap-3 p-4">
      <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-sky-s text-sky-d">
        <BookingIcon kind={b.kind} />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[15.5px] font-bold">{bookingTitle(b)}</b>
        <span className="s13">{w.date ? `${md(w.date)} ${w.time ?? ""}` : "날짜 미정"}</span>
      </span>
      <StatusTag s={b.status} />
    </Link>
  );
}

export default async function BookingsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string }> }) {
  const { id } = await params;
  const { k = "all" } = await searchParams;
  const { supabase } = await loadTrip(id);
  const { data } = await supabase.from("bookings").select("*").eq("trip_id", id).order("sort_key", { nullsFirst: false }).order("created_at");
  const all = (data ?? []) as Booking[];
  const count = (key: string) => all.filter((b) => b.kind === key).length;
  const groups = BOOKING_KINDS.filter((g) => (k === "all" ? count(g.key) > 0 : g.key === k));

  return (
    <main>
      <LiveRefresh tripId={id} table="bookings" />
      <header className="hd !pb-1">
        <Link href={`/trips/${id}/more`} className="ib -ml-2" aria-label="뒤로">
          <ChevronLeft size={24} />
        </Link>
        <h1>예약</h1>
        <Link href={`/trips/${id}/bookings/new${k !== "all" ? `?kind=${k}` : ""}`} className="ib" aria-label="예약 추가">
          <Plus size={22} />
        </Link>
      </header>
      <nav className="tabs sticky top-[60px] z-10 overflow-x-auto">
        <Link href="?k=all" className={`flex-none ${k === "all" ? "on" : ""}`}>
          전체 {all.length}
        </Link>
        {BOOKING_KINDS.map((g) => (
          <Link key={g.key} href={`?k=${g.key}`} className={`flex-none ${k === g.key ? "on" : ""}`}>
            {g.short}
            {count(g.key) ? ` ${count(g.key)}` : ""}
          </Link>
        ))}
      </nav>

      <div className="px-4">
        {groups.map((g) => (
          <section key={g.key}>
            <div className="mx-1 mb-2 mt-5 text-[13.5px] font-bold text-sub">{g.label}</div>
            <div className="flex flex-col gap-2.5">
              {all
                .filter((b) => b.kind === g.key)
                .map((b) => (b.kind === "flight" ? <FlightCard key={b.id} b={b} tid={id} /> : b.kind === "hotel" ? <HotelCard key={b.id} b={b} tid={id} /> : <RowCard key={b.id} b={b} tid={id} />))}
            </div>
          </section>
        ))}
        {groups.length === 0 && <p className="py-16 text-center text-sm text-sub">아직 예약이 없어요</p>}
        <Link href={`/trips/${id}/bookings/new${k !== "all" ? `?kind=${k}` : ""}`} className="addline mt-4">
          <Plus size={16} /> 예약 추가
        </Link>
      </div>
    </main>
  );
}
