"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Plane, Search, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CITY_GROUPS, COUNTRIES, COVER_COLORS, CURRENCIES } from "@/lib/places";
import type { Trip } from "@/lib/types";
import { coverStyle } from "./bits";

type Props = { trip?: Trip };

export default function TripForm({ trip }: Props) {
  const router = useRouter();
  const edit = !!trip;
  const [title, setTitle] = useState(trip?.title ?? "");
  const [color, setColor] = useState(trip?.cover_color ?? COVER_COLORS[0]);
  const [kind, setKind] = useState<"abroad" | "domestic">(trip?.kind ?? "abroad");
  const [countries, setCountries] = useState<string[]>(trip?.countries ?? []);
  const [cities, setCities] = useState<string[]>(trip?.cities ?? []);
  const [start, setStart] = useState(trip?.start_date ?? "");
  const [end, setEnd] = useState(trip?.end_date ?? "");
  const [cur, setCur] = useState(trip?.currency ?? "JPY");
  const [rate, setRate] = useState(String(trip?.rate ?? CURRENCIES.JPY.rate));
  const [rateEdit, setRateEdit] = useState(false);
  const [q, setQ] = useState("");
  const [cityQ, setCityQ] = useState("");
  const [busy, setBusy] = useState(false);

  const currency = CURRENCIES[cur] ?? CURRENCIES.KRW;
  const found = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (!v) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.includes(v) || c.en.toLowerCase().includes(v));
  }, [q]);

  function toggleCountry(code: string) {
    const nextList = countries.includes(code) ? countries.filter((c) => c !== code) : [...countries, code];
    setCountries(nextList);
    // 첫 나라의 통화로 맞춰요
    const first = COUNTRIES.find((c) => c.code === nextList[0]);
    if (first && CURRENCIES[first.cur] && first.cur !== cur) {
      setCur(first.cur);
      setRate(String(CURRENCIES[first.cur].rate));
      setRateEdit(false);
    }
  }
  function toggleCity(c: string) {
    setCities(cities.includes(c) ? cities.filter((x) => x !== c) : [...cities, c]);
  }

  const ok = title.trim() && (kind === "domestic" ? cities.length : countries.length);

  async function save() {
    if (!ok) return;
    setBusy(true);
    const supabase = createClient();
    const domestic = kind === "domestic";
    const payload = {
      title: title.trim(),
      start: start || null,
      end: end || start || null,
      kind,
      countries: domestic ? ["kr"] : countries,
      cities: domestic ? cities : [],
      color,
      currency: domestic ? "KRW" : cur,
      unit: domestic ? 1 : currency.unit,
      rate: domestic ? 1 : Number(rate.replace(/,/g, "")) || currency.rate,
    };
    if (edit) {
      const { error } = await supabase
        .from("trips")
        .update({
          title: payload.title,
          start_date: payload.start,
          end_date: payload.end,
          kind,
          countries: payload.countries,
          cities: payload.cities,
          cover_color: color,
          currency: payload.currency,
          rate_unit: payload.unit,
          rate: payload.rate,
        })
        .eq("id", trip!.id);
      setBusy(false);
      if (error) return alert("저장하지 못했어요");
      router.push(`/trips/${trip!.id}`);
      router.refresh();
      return;
    }
    const { data, error } = await supabase.rpc("create_trip", {
      p_title: payload.title,
      p_start: payload.start,
      p_end: payload.end,
      p_kind: kind,
      p_countries: payload.countries,
      p_cities: payload.cities,
      p_cover_color: color,
      p_currency: payload.currency,
      p_rate_unit: payload.unit,
      p_rate: payload.rate,
    });
    setBusy(false);
    if (error || !data) return alert("여행을 만들지 못했어요");
    router.replace(`/trips/${data}`);
    router.refresh();
  }

  async function remove() {
    if (!trip || !confirm("이 여행을 지울까요?\n일정, 예약, 경비, 기록이 모두 지워지고 되돌릴 수 없어요.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("trips").delete().eq("id", trip.id);
    if (error) return alert("방장만 여행을 지울 수 있어요");
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="pb-16">
      <header className="hd">
        <button className="ib" onClick={() => router.back()} aria-label="닫기">
          <X size={22} />
        </button>
        <h1>{edit ? "여행 정보 수정" : "새 여행"}</h1>
        <button className="px-1 text-[15px] font-bold text-sky-d disabled:text-sub2" disabled={!ok || busy} onClick={save}>
          {edit ? "저장" : "만들기"}
        </button>
      </header>

      <div className="px-5">
        <div className="mt-3 flex h-[150px] flex-col items-center justify-center rounded-[20px] px-6 text-center text-white" style={coverStyle({ cover_color: color, cover_photo: null })}>
          <div className="text-[24px] font-extrabold tracking-tight">{title || "여행 이름"}</div>
          {start && <div className="mt-1 text-[13px] opacity-90">{start.replace(/-/g, ". ")}{end && end !== start ? ` — ${end.slice(5).replace("-", ". ")}` : ""}</div>}
        </div>
        <div className="mt-4 flex justify-between">
          {COVER_COLORS.map((c) => (
            <button key={c} aria-label={c} onClick={() => setColor(c)} className="h-9 w-9 rounded-full" style={{ background: c, boxShadow: c === color ? "0 0 0 2px #F2F4F6, 0 0 0 4px #191F28" : undefined }} />
          ))}
        </div>

        <label className="flab">여행 이름</label>
        <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 세자매 후쿠오카 여행" />

        <label className="flab">날짜</label>
        <div className="flex items-center gap-2">
          <input type="date" className="inp" value={start} onChange={(e) => { setStart(e.target.value); if (!end || end < e.target.value) setEnd(e.target.value); }} />
          <span className="text-sub">–</span>
          <input type="date" className="inp" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
        </div>

        <label className="flab">어디로 가요?</label>
        <div className="flex rounded-[14px] bg-line/60 p-1">
          {(["abroad", "domestic"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2.5 text-sm font-bold ${kind === k ? "bg-white text-ink shadow-sm" : "text-sub"}`}>
              {k === "abroad" ? <Plane size={16} /> : <Car size={16} />}
              {k === "abroad" ? "해외여행" : "국내여행"}
            </button>
          ))}
        </div>

        {kind === "abroad" ? (
          <>
            {countries.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {countries.map((c) => {
                  const it = COUNTRIES.find((x) => x.code === c);
                  return (
                    <button key={c} onClick={() => toggleCountry(c)} className="flex items-center gap-1.5 rounded-full bg-char py-1.5 pl-2 pr-3 text-[13px] font-bold text-white">
                      <span className={`flag fi fi-${c}`} style={{ width: 16, height: 12 }} />
                      {it?.name} ✕
                    </button>
                  );
                })}
              </div>
            )}
            <div className="inp mt-3 flex items-center gap-2 !py-3">
              <Search size={17} className="text-sub" />
              <input className="flex-1 bg-transparent outline-none" placeholder="나라 검색 (한글 · 영어)" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="card mt-2 max-h-[260px] overflow-y-auto px-2">
              {found.map((c) => (
                <button key={c.code} onClick={() => toggleCountry(c.code)} className="flex w-full items-center gap-3 border-b border-line px-2 py-2.5 text-left last:border-0">
                  <span className={`flag fi fi-${c.code}`} style={{ width: 22, height: 16 }} />
                  <span className="flex-1 text-[15px] font-semibold">{c.name} <span className="text-xs font-normal text-sub">{c.en}</span></span>
                  <span className={`h-5 w-5 rounded-md border-2 ${countries.includes(c.code) ? "border-char bg-char" : "border-line"}`} />
                </button>
              ))}
              {found.length === 0 && <p className="py-6 text-center text-sm text-sub">찾는 나라가 없어요</p>}
            </div>

            <label className="flab">여행 통화 · 환율</label>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set(countries.map((c) => COUNTRIES.find((x) => x.code === c)?.cur).filter(Boolean) as string[])).map((code) => (
                <button key={code} className={`chip ${code === cur ? "on" : ""}`} onClick={() => { setCur(code); setRate(String(CURRENCIES[code]?.rate ?? 1)); setRateEdit(false); }}>
                  {code} {CURRENCIES[code]?.name}
                </button>
              ))}
            </div>
            <div className={`inp mt-2 flex items-center ${rateEdit ? "!border-sky" : ""}`}>
              <span className="flex-1 font-semibold">{currency.sym}{currency.unit.toLocaleString()} =</span>
              <span className="font-bold">₩</span>
              <input
                className={`w-24 bg-transparent text-right font-bold outline-none ${rateEdit ? "border-b-2 border-sky" : ""}`}
                inputMode="decimal"
                readOnly={!rateEdit}
                value={rate}
                onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))}
              />
            </div>
            <button className="mt-2 text-[13px] font-semibold text-sky-d" onClick={() => setRateEdit(!rateEdit)}>
              {rateEdit ? "직접 입력 끝내기" : "환율 직접 입력"}
            </button>
          </>
        ) : (
          <>
            {cities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cities.map((c) => (
                  <button key={c} onClick={() => toggleCity(c)} className="rounded-full bg-char px-3 py-1.5 text-[13px] font-bold text-white">
                    {c} ✕
                  </button>
                ))}
              </div>
            )}
            <div className="inp mt-3 flex items-center gap-2 !py-3">
              <Search size={17} className="text-sub" />
              <input className="flex-1 bg-transparent outline-none" placeholder="도시 검색" value={cityQ} onChange={(e) => setCityQ(e.target.value)} />
            </div>
            {cityQ.trim() && !CITY_GROUPS.some((g) => g.cities.includes(cityQ.trim())) && (
              <button onClick={() => { toggleCity(cityQ.trim()); setCityQ(""); }} className="mt-2 rounded-full border-[1.5px] border-dashed border-sky px-3.5 py-2 text-[13px] font-bold text-sky-d">
                + &apos;{cityQ.trim()}&apos; 직접 추가
              </button>
            )}
            {CITY_GROUPS.map((g) => {
              const list = g.cities.filter((c) => !cityQ.trim() || c.includes(cityQ.trim()));
              if (!list.length) return null;
              return (
                <div key={g.region} className="mt-3">
                  <div className="mb-1.5 text-xs font-bold text-sub">{g.region}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((c) => (
                      <button key={c} onClick={() => toggleCity(c)} className={`chip ${cities.includes(c) ? "!border-sky !bg-sky-s !text-sky-d" : ""}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {edit && (
          <button className="dellink w-full" onClick={remove}>
            <Trash2 size={16} /> 여행 삭제
          </button>
        )}
      </div>
    </main>
  );
}
