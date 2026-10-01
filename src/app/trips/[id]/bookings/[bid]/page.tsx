import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronLeft, ExternalLink, Pencil, ReceiptText } from "lucide-react";
import { loadTrip } from "@/lib/trip";
import { BOOKING_FIELDS, between, bookingTitle, kindLabel, nights } from "@/lib/booking";
import { days, md } from "@/lib/format";
import { money, sym, toKrw } from "@/lib/money";
import { BookingIcon } from "@/components/icons";
import { StatusTag } from "@/components/bits";
import BookingToPlan from "@/components/BookingToPlan";
import Photos from "@/components/ui/Photos";
import type { Booking } from "@/lib/types";

export default async function BookingDetail({ params }: { params: Promise<{ id: string; bid: string }> }) {
  const { id, bid } = await params;
  const { supabase, trip, members } = await loadTrip(id);
  const [{ data }, ev, ex] = await Promise.all([
    supabase.from("bookings").select("*").eq("id", bid).eq("trip_id", id).maybeSingle(),
    supabase.from("events").select("id, day").eq("booking_id", bid).order("day"),
    supabase.from("expenses").select("id", { count: "exact", head: true }).eq("booking_id", bid),
  ]);
  if (!data) notFound();
  const b = data as Booking;
  const d = b.details || {};
  const linked = ev.data ?? [];
  const shown = new Set(["date", "from", "to", "from_time", "to_time", "airline", "flight_no", "checkin", "checkout", "checkin_time", "checkout_time"]);
  const rest = BOOKING_FIELDS[b.kind].filter((f) => !shown.has(f.key) && d[f.key]);
  const krw = b.amount != null ? toKrw(Number(b.amount), b.currency || "KRW", trip) : 0;

  return (
    <main className="pb-10">
      <header className="hd">
        <Link href={`/trips/${id}/bookings`} className="ib -ml-2" aria-label="뒤로">
          <ChevronLeft size={24} />
        </Link>
        <h1>{kindLabel(b.kind)}</h1>
        <Link href={`/trips/${id}/bookings/${bid}/edit`} className="ib" aria-label="수정">
          <Pencil size={20} />
        </Link>
      </header>

      <div className="px-4 pt-2">
        <section className="card p-5">
          {b.kind === "flight" ? (
            <>
              <div className="flex justify-between text-[12.5px] font-semibold text-sub">
                <span>{[d.airline, d.flight_no].filter(Boolean).join(" · ")}</span>
                <span>{d.date ? md(d.date) : ""}</span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <b className="block break-keep text-[26px] font-extrabold leading-tight tracking-tight">{d.from || "출발"}</b>
                  <b className="mt-1 block text-[17px]">{d.from_time}</b>
                </div>
                <span className="pb-1 text-[12px] text-sub">{between(d.from_time, d.to_time)}</span>
                <div className="min-w-0 text-right">
                  <b className="block break-keep text-[26px] font-extrabold leading-tight tracking-tight">{d.to || "도착"}</b>
                  <b className="mt-1 block text-[17px]">{d.to_time}</b>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-s px-1.5 py-0.5 text-[11.5px] font-bold text-sky-d">
                  <BookingIcon kind={b.kind} size={13} /> {kindLabel(b.kind)}
                </span>
                <StatusTag s={b.status} />
              </div>
              <b className="mt-2 block text-[21px] font-extrabold leading-snug tracking-tight">{bookingTitle(b)}</b>
              {b.kind === "hotel" && (
                <div className="mt-4 flex items-center rounded-xl bg-bg px-4 py-3">
                  <div className="flex-1">
                    <span className="block text-[12px] text-sky-d">체크인</span>
                    <b className="text-[16px]">{d.checkin ? md(d.checkin) : "-"}</b>
                    {d.checkin_time && <span className="block text-[12px] text-sub">{d.checkin_time}부터</span>}
                  </div>
                  <b className="px-2 text-[13px]">{nights(d.checkin, d.checkout) > 0 ? `${nights(d.checkin, d.checkout)}박` : ""}</b>
                  <div className="flex-1">
                    <span className="block text-[12px] text-sky-d">체크아웃</span>
                    <b className="text-[16px]">{d.checkout ? md(d.checkout) : "-"}</b>
                    {d.checkout_time && <span className="block text-[12px] text-sub">{d.checkout_time}까지</span>}
                  </div>
                </div>
              )}
              {["restaurant", "tour", "etc"].includes(b.kind) && d.date && (
                <div className="mt-1 text-[15px] font-semibold text-ink2">
                  {md(d.date)} {d.time}
                </div>
              )}
            </>
          )}

          {rest.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3.5 border-t border-dashed border-line pt-4">
              {rest.map((f) => (
                <div key={f.key} className={f.key === "address" || f.key === "room" || f.key === "open_at" ? "col-span-2" : ""}>
                  <span className="block text-[12px] text-sub">{f.label}</span>
                  {f.key === "phone" ? (
                    <a href={`tel:${d[f.key]}`} className="text-[15px] font-bold text-sky-d">
                      {d[f.key]}
                    </a>
                  ) : (
                    <b className="select-all break-words text-[15px]">{d[f.key]}</b>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {b.photos?.length > 0 && (
          <section className="card mt-2.5 p-4">
            <Photos urls={b.photos} />
          </section>
        )}

        {b.amount != null && (
          <section className="card mt-2.5 flex items-center justify-between p-4">
            <div>
              <span className="text-[13px] text-sub">금액</span>
              {b.currency !== "KRW" && <span className="block text-[12.5px] text-sub">≈ {money(krw, "₩")}</span>}
              {members.length > 1 && <span className="block text-[12.5px] text-sub">1인 {money(krw / members.length, "₩")}</span>}
            </div>
            <div className="text-right">
              <b className="text-[18px]">{money(Number(b.amount), sym(b.currency || "KRW"))}</b>
              {d.pay && <span className="block text-[12.5px] font-semibold text-sub">{d.pay}</span>}
            </div>
          </section>
        )}

        {(b.memo || b.link) && (
          <section className="card mt-2.5 p-4">
            {b.memo && <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink2">{b.memo}</p>}
            {b.link && /^https?:\/\//.test(b.link) && (
              <a href={b.link} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 text-[14px] font-semibold text-sky-d ${b.memo ? "mt-3" : ""}`}>
                <ExternalLink size={15} /> 예약 페이지 열기
              </a>
            )}
          </section>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {linked.length ? (
            <Link href={`/trips/${id}/plan?day=${linked[0].day ?? "none"}`} className="btn flex items-center justify-center gap-1.5 !py-3.5 !text-[15px]">
              <CalendarDays size={17} /> 일정에서 보기
            </Link>
          ) : (
            <BookingToPlan b={b} days={days(trip.start_date, trip.end_date)} />
          )}
          <Link href={`/trips/${id}/money?tab=list`} className="btn-sub flex items-center justify-center gap-1.5 !py-3.5 !text-[15px]">
            <ReceiptText size={17} /> 경비 내역{ex.count ? ` ${ex.count}` : ""}
          </Link>
        </div>
      </div>
    </main>
  );
}
