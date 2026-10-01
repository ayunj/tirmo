"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CITY_GROUPS, COUNTRIES, CURRENCIES } from "@/lib/places";
import { COVERS, coverDate, coverPair } from "@/lib/cover";
import { uploadPhoto } from "@/lib/photo";
import { askDel, toast } from "@/lib/ui";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import { Names } from "@/components/TripFlags";
import Sheet from "@/components/ui/Sheet";
import DatePick from "@/components/ui/DatePick";
import type { Trip } from "@/lib/types";

const WK = ["일", "월", "화", "수", "목", "금", "토"];
const fmtFull = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} (${WK[new Date(y, m - 1, d).getDay()]})`;
};
const fmtShort = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return `${m}.${d} (${WK[new Date(y, m - 1, d).getDay()]})`;
};
const REGIONS = [
  ["asia", "아시아"],
  ["europe", "유럽"],
  ["america", "아메리카"],
  ["etc", "기타"],
] as const;

type Props = {
  trip?: Trip;
  members?: { nickname: string; color: string }[];
  recentCountries?: string[];
  recentCities?: string[];
};

export default function TripForm({ trip, members = [], recentCountries = [], recentCities = [] }: Props) {
  const router = useRouter();
  const edit = !!trip;
  const [title, setTitle] = useState(trip?.title ?? "");
  const [color, setColor] = useState(coverPair(trip?.cover_color)[0]);
  const [mode, setMode] = useState<"color" | "photo">(trip?.cover_photo ? "photo" : "color");
  const [photo] = useState<string | null>(trip?.cover_photo ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<"abroad" | "domestic">(trip?.kind ?? "abroad");
  const [countries, setCountries] = useState<string[]>(trip?.kind === "domestic" ? [] : trip?.countries ?? []);
  const [cities, setCities] = useState<string[]>(trip?.cities ?? []);
  const [start, setStart] = useState<string | null>(trip?.start_date ?? null);
  const [end, setEnd] = useState<string | null>(trip?.end_date ?? null);
  const [cur, setCur] = useState(trip?.currency && trip.currency !== "KRW" ? trip.currency : "JPY");
  const [rate, setRate] = useState(String(trip && trip.currency !== "KRW" ? trip.rate : CURRENCIES.JPY.rate));
  const [rateEdit, setRateEdit] = useState(false);
  const [sheet, setSheet] = useState<"" | "place" | "date" | "cur">("");
  const [busy, setBusy] = useState(false);

  // 장소 창
  const [ab, setAb] = useState<"out" | "dom">(kind === "domestic" ? "dom" : "out");
  const [rg, setRg] = useState<string>("asia");
  const [q, setQ] = useState("");
  const [cq, setCq] = useState("");
  const [mine, setMine] = useState<string[]>((trip?.cities ?? []).filter((c) => !CITY_GROUPS.some((g) => g.cities.includes(c))));

  const c = CURRENCIES[cur] ?? CURRENCIES.JPY;
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : photo), [file, photo]);
  const found = useMemo(() => {
    const v = q.trim().toLowerCase();
    return v ? COUNTRIES.filter((x) => x.name.includes(v) || x.en.toLowerCase().includes(v) || x.cur.toLowerCase().includes(v)) : [];
  }, [q]);

  function toggleCountry(code: string) {
    const next = countries.includes(code) ? countries.filter((x) => x !== code) : [...countries, code];
    setCountries(next);
    const first = COUNTRIES.find((x) => x.code === next[0]);
    if (first && CURRENCIES[first.cur] && first.cur !== cur) {
      setCur(first.cur);
      setRate(String(CURRENCIES[first.cur].rate));
      setRateEdit(false);
    }
  }
  const toggleCity = (x: string) => setCities(cities.includes(x) ? cities.filter((y) => y !== x) : [...cities, x]);

  const domestic = ab === "dom";
  const ok = !!title.trim() && (domestic ? cities.length > 0 : countries.length > 0);
  const nights = start && end ? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 864e5) : 0;
  const pairStyle = { "--cv1": coverPair(color)[0], "--cv2": coverPair(color)[1] } as React.CSSProperties;

  async function save() {
    if (!ok) {
      if (!title.trim()) toast("여행 이름을 적어 주세요");
      else toast(domestic ? "도시를 골라 주세요" : "나라를 골라 주세요");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const rateN = Number(rate.replace(/,/g, "")) || c.rate;
    const row = {
      title: title.trim(),
      start_date: start,
      end_date: end || start,
      kind: domestic ? "domestic" : "abroad",
      countries: domestic ? ["kr"] : countries,
      cities: domestic ? cities : [],
      cover_color: color,
      currency: domestic ? "KRW" : cur,
      rate_unit: domestic ? 1 : c.unit,
      rate: domestic ? 1 : rateN,
    };
    let id = trip?.id;
    if (edit) {
      const { error } = await supabase.from("trips").update(row).eq("id", id!);
      if (error) return fail();
    } else {
      const { data, error } = await supabase.rpc("create_trip", {
        p_title: row.title,
        p_start: row.start_date,
        p_end: row.end_date,
        p_kind: row.kind,
        p_countries: row.countries,
        p_cities: row.cities,
        p_cover_color: row.cover_color,
        p_currency: row.currency,
        p_rate_unit: row.rate_unit,
        p_rate: row.rate,
      });
      if (error || !data) return fail();
      id = data as string;
    }
    // 커버 사진
    let cover = mode === "photo" ? photo : null;
    if (mode === "photo" && file) {
      try {
        cover = await uploadPhoto(id!, file);
      } catch {
        toast("사진을 올리지 못했어요");
      }
    }
    if (cover !== (trip?.cover_photo ?? null)) await supabase.from("trips").update({ cover_photo: cover }).eq("id", id!);
    router.replace(`/trips/${id}`);
    router.refresh();
  }
  function fail() {
    setBusy(false);
    toast("저장하지 못했어요");
  }

  async function remove() {
    if (!trip || !(await askDel("이 여행을 지울까요?", "일정, 예약, 경비, 기록이 모두 지워지고 되돌릴 수 없어요"))) return;
    const { error } = await createClient().from("trips").delete().eq("id", trip.id);
    if (error) return toast("방장만 지울 수 있어요");
    toast("여행을 지웠어요");
    router.replace("/");
    router.refresh();
  }

  const destLabel = domestic ? (cities.length > 3 ? `${cities.slice(0, 3).join(", ")} 외 ${cities.length - 3}` : cities.join(", ")) : countries.map((x) => COUNTRIES.find((y) => y.code === x)?.name).join(", ");
  const recentC = (recentCountries.length ? recentCountries : ["jp", "th"]).slice(0, 4);

  return (
    <section className={`screen on${edit ? " editmode" : ""}`} id="tripAdd">
      <div className="scr nonav">
        <div className="hd">
          <Go as="span" className="ib" back>
            <Ic n="x" />
          </Go>
          <h2>{edit ? "여행 정보 수정" : "새 여행"}</h2>
          <span className={`txtbtn${busy ? " off" : ""}`} onClick={save}>
            {busy ? "저장 중" : edit ? "저장" : "만들기"}
          </span>
        </div>
        <div className="pad">
          <div className="coverpick colorcv" style={pairStyle}>
            {mode === "photo" && preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="im" src={preview} alt="" style={{ position: "absolute", inset: 0 }} />
            )}
            <div className="cc">
              <div className="disp cc-t" style={{ fontSize: 26 }}>
                {title || "여행 이름"}
              </div>
              <div className="cc-d">{coverDate(start, end)}</div>
            </div>
          </div>
          <div className="cvmode">
            <div className={mode === "color" ? "on" : ""} onClick={() => setMode("color")}>
              <Ic n="palette" /> 색상
            </div>
            <label className={mode === "photo" ? "on" : ""} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: "pointer", color: mode === "photo" ? "var(--ink)" : "var(--sub)", background: mode === "photo" ? "var(--card)" : "none" }}>
              <Ic n="image" /> 사진 올리기
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setMode("photo");
                  }
                }}
              />
            </label>
          </div>
          {mode === "color" && (
            <div className="swatches">
              {COVERS.map(([a, b]) => (
                <i key={a} className={color === a ? "on" : ""} style={{ "--c1": a, "--c2": b } as React.CSSProperties} onClick={() => setColor(a)} />
              ))}
            </div>
          )}
          <div className="form">
            <label>
              여행 이름 <span className="sub">커버 가운데에 크게 들어가요</span>
            </label>
            <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 세자매 후쿠오카 여행" maxLength={30} />
            <label>어디로 가요?</label>
            <div className="inp row" onClick={() => setSheet("place")} style={{ cursor: "pointer" }}>
              <span className="dest">
                {domestic ? (
                  cities.length ? (
                    <>
                      <Ic n="map-pin" className="dpin" />
                      <span className="dn">{destLabel}</span>
                    </>
                  ) : (
                    <span className="sub">도시 고르기</span>
                  )
                ) : countries.length ? (
                  <>
                    {countries.slice(0, 3).map((x) => (
                      <span key={x} className={`fi fi-${x} fis flag`} />
                    ))}
                    <span className="dn">{destLabel}</span>
                  </>
                ) : (
                  <span className="sub">나라 고르기</span>
                )}
              </span>
              <Ic n="chevron-right" />
            </div>
            <label>날짜</label>
            <div className="inp row" onClick={() => setSheet("date")} style={{ cursor: "pointer" }}>
              <span>{start ? `${fmtFull(start)}${end && end !== start ? ` – ${fmtShort(end)}` : ""}` : <span className="sub">날짜 고르기</span>}</span>
              <span className="sub">{start ? (nights > 0 ? `${nights}박 ${nights + 1}일` : "당일") : ""}</span>
            </div>
            <label>함께 가는 사람</label>
            <div className="inp row">
              <Names list={members} />
              {edit ? (
                <Go as="span" className="link" href={`/trips/${trip!.id}/invite`}>
                  <Ic n="link" /> 초대 링크 보내기
                </Go>
              ) : (
                <span className="link" onClick={() => toast("여행을 만든 뒤 초대 링크를 보낼 수 있어요")}>
                  <Ic n="link" /> 초대 링크 보내기
                </span>
              )}
            </div>
            {!domestic && (
              <>
                <label className="curlab">여행 통화</label>
                <div className="inp row curRow" onClick={() => setSheet("cur")} style={{ cursor: "pointer" }}>
                  <span id="curTxt">
                    <span className={`fi fi-${COUNTRIES.find((x) => x.cur === cur)?.code ?? (cur === "EUR" ? "eu" : "un")} fis flag`} /> {cur} {c.name} · {c.sym.trim()}
                    {c.unit.toLocaleString()} = ₩{Number(rate.replace(/,/g, "") || 0).toLocaleString()}
                  </span>
                  <Ic n="chevron-right" />
                </div>
              </>
            )}
          </div>
          {edit && (
            <div className="dellink" onClick={remove}>
              <Ic n="trash" /> 여행 삭제
            </div>
          )}
        </div>
      </div>

      <DatePick
        open={sheet === "date"}
        onClose={() => setSheet("")}
        mode="range"
        a={start}
        b={end}
        onDone={(a, b) => {
          setStart(a);
          setEnd(b);
        }}
      />

      <Sheet open={sheet === "place"} onClose={() => setSheet("")} title="어디로 가요?" id="placePick">
        <div className="segm abseg" id="abSeg" style={{ marginTop: 12 }}>
          <span className={ab === "out" ? "on" : ""} onClick={() => setAb("out")}>
            <Ic n="plane" /> 해외여행
          </span>
          <span className={ab === "dom" ? "on" : ""} onClick={() => setAb("dom")}>
            <Ic n="car" /> 국내여행
          </span>
        </div>
        <div className={`abpane${ab === "out" ? " on" : ""}`}>
          <div className={`pane on${q ? " searching" : ""}`}>
            <div className="sbox sin" style={{ marginTop: 12 }}>
              <Ic n="search" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="나라 검색 (한글 · 영어)" autoComplete="off" />
              <i className="sx" onClick={() => setQ("")}>
                <Ic n="x" />
              </i>
            </div>
            {q && found.length === 0 && (
              <div className="noresult" style={{ display: "block" }}>
                찾는 나라가 없어요
              </div>
            )}
            <div className="selw">
              {countries.map((x) => (
                <span key={x} className="selc">
                  <span className={`fi fi-${x} fis flag`} />
                  <span>{COUNTRIES.find((y) => y.code === x)?.name}</span>
                  <i onClick={() => toggleCountry(x)}>✕</i>
                </span>
              ))}
            </div>
            <label className="flab">최근 간 나라</label>
            <div className="ctry">
              {recentC.map((x) => (
                <div key={x} className={countries.includes(x) ? "on" : ""} onClick={() => toggleCountry(x)}>
                  <span className={`fi fi-${x} fis flag`} />
                  <b>{COUNTRIES.find((y) => y.code === x)?.name}</b>
                </div>
              ))}
            </div>
            <label className="flab">
              전체 나라{" "}
              <span className="sub" style={{ fontWeight: 500 }}>
                여러 나라 고를 수 있어요
              </span>
            </label>
            <div className="segm four">
              {REGIONS.map(([k, l]) => (
                <span key={k} className={rg === k ? "on" : ""} onClick={() => setRg(k)}>
                  {l}
                </span>
              ))}
            </div>
            <div className="pane on">
              <div className="curl mc">
                {(q ? found : COUNTRIES.filter((x) => x.region === rg)).map((x) => (
                  <div key={x.code} className={countries.includes(x.code) ? "on" : ""} onClick={() => toggleCountry(x.code)}>
                    <span className={`fi fi-${x.code} fis flag`} />
                    <div className="mid">
                      <b>{x.name}</b>
                      <span>
                        {x.en} · {x.cur}
                      </span>
                    </div>
                    <i className="ck" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={`abpane${ab === "dom" ? " on" : ""}${cq ? " searching" : ""}`}>
          <div className="sbox sin" style={{ marginTop: 12 }}>
            <Ic n="search" />
            <input value={cq} onChange={(e) => setCq(e.target.value)} placeholder="도시 검색" autoComplete="off" />
            <i className="sx" onClick={() => setCq("")}>
              <Ic n="x" />
            </i>
          </div>
          <div className="cities cadd">
            {cq.trim() && ![...CITY_GROUPS.flatMap((g) => g.cities), ...mine].includes(cq.trim()) && (
              <span
                className="addc"
                onClick={() => {
                  const n = cq.trim();
                  setMine([...mine, n]);
                  setCities([...cities, n]);
                  setCq("");
                  toast(`${n} 추가했어요`);
                }}
              >
                <Ic n="plus" /> &apos;{cq.trim()}&apos; 직접 추가
              </span>
            )}
          </div>
          <div className="selw">
            {cities.map((x) => (
              <span key={x} className="selc">
                <span>{x}</span>
                <i onClick={() => toggleCity(x)}>✕</i>
              </span>
            ))}
          </div>
          {recentCities.length > 0 && (
            <>
              <label className="flab">최근 간 곳</label>
              <div className="cities">
                {recentCities.slice(0, 6).map((x) => (
                  <span key={x} className={cities.includes(x) ? "on" : ""} onClick={() => toggleCity(x)}>
                    {x}
                  </span>
                ))}
              </div>
            </>
          )}
          <label className="flab">
            전체{" "}
            <span className="sub" style={{ fontWeight: 500 }}>
              여러 도시 고를 수 있어요
            </span>
          </label>
          {[...(mine.length ? [{ region: "직접 추가", cities: mine }] : []), ...CITY_GROUPS].map((g) => {
            const list = g.cities.filter((x) => !cq.trim() || x.includes(cq.trim()));
            if (!list.length) return null;
            return (
              <div key={g.region} className="cgrp">
                <em>{g.region}</em>
                <div className="cities">
                  {list.map((x) => (
                    <span key={x} className={cities.includes(x) ? "on" : ""} onClick={() => toggleCity(x)}>
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="bigbtn"
          onClick={() => {
            setKind(ab === "dom" ? "domestic" : "abroad");
            setSheet("");
          }}
        >
          완료
        </div>
      </Sheet>

      <Sheet open={sheet === "cur"} onClose={() => setSheet("")} title="여행 통화" id="curPick">
        <div className="curl">
          {Object.values(CURRENCIES)
            .filter((x) => x.code !== "KRW")
            .map((x) => {
              const code = COUNTRIES.find((y) => y.cur === x.code)?.code ?? (x.code === "EUR" ? "eu" : "un");
              return (
                <div
                  key={x.code}
                  className={cur === x.code ? "on" : ""}
                  onClick={() => {
                    setCur(x.code);
                    setRate(String(x.rate));
                    setRateEdit(false);
                  }}
                >
                  <span className="flw">
                    <span className={`fi fi-${code} fis flag`} />
                  </span>
                  <div className="mid">
                    <b>{x.name}</b>
                    <span>
                      {x.code} · {x.sym.trim()}
                    </span>
                  </div>
                  <em>
                    {x.sym.trim()}
                    {x.unit.toLocaleString()} = ₩{x.rate.toLocaleString()}
                  </em>
                  <i className="rdo" />
                </div>
              );
            })}
        </div>
        <label className="flab">환율</label>
        <div className="segm">
          <span
            className={!rateEdit ? "on" : ""}
            onClick={() => {
              setRateEdit(false);
              setRate(String(c.rate));
            }}
          >
            기본 환율
          </span>
          <span className={rateEdit ? "on" : ""} onClick={() => setRateEdit(true)}>
            직접 입력
          </span>
        </div>
        <div className={`inp row tin${rateEdit ? " edit" : ""}`} id="rateRow" style={{ marginTop: 10 }}>
          <span id="rateL">
            {c.sym.trim()}
            {c.unit.toLocaleString()} =
          </span>
          <span className="rr">
            ₩
            {rateEdit ? (
              <input
                id="rateV"
                autoFocus
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))}
                style={{ border: 0, outline: 0, background: "none", width: `${Math.max(2, rate.length) + 1}ch`, font: "inherit", fontWeight: 700, borderBottom: "2px solid var(--brand)" }}
              />
            ) : (
              <b id="rateV">{Number(rate.replace(/,/g, "") || 0).toLocaleString()}</b>
            )}
          </span>
        </div>
        {rateEdit && (
          <div className="sub" style={{ marginTop: 6 }}>
            원화 금액만 고쳐요
          </div>
        )}
        <div className="bigbtn" onClick={() => setSheet("")}>
          완료
        </div>
      </Sheet>
    </section>
  );
}
