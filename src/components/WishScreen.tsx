"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto, removePhotos } from "@/lib/photo";
import { askDel, toast } from "@/lib/ui";
import Go from "@/components/Go";
import TripTitle from "@/components/TripTitle";
import Ic from "@/components/Ic";
import { WISH_KINDS, wishKind } from "@/lib/wish";
import Sheet from "@/components/ui/Sheet";
import PlanPick, { type DayEv } from "@/components/ui/PlanPick";
import type { Wish } from "@/lib/types";

const wk = wishKind;
const SEQ = ["todo", "buy", "no"] as const;
type St = (typeof SEQ)[number];
const stOf = (s: string | null): St =>
  s === "done" ? "buy" : SEQ.includes(s as St) ? (s as St) : "todo";
const StIc = ({ s }: { s: St }) => (
  <i className={`st ${s}`}>
    {s === "buy" ? (
      <Ic n="check" />
    ) : s === "no" ? (
      <Ic n="x" />
    ) : null}
  </i>
);

type Props = {
  tripId: string;
  head: { title: string; start_date: string | null; end_date: string | null };
  tab: "place" | "shop";
  wishes: Wish[];
  days: string[];
  events: DayEv[];
  planned: Record<string, string | null>;
  me: string;
  together: boolean;
};

/** 위시리스트 (목업 wish + wishItem · shopItem · planPick 창) */
export default function WishScreen({
  tripId,
  head,
  tab,
  wishes,
  days,
  events,
  planned,
  me,
  together,
}: Props) {
  const router = useRouter();
  const places = wishes.filter((w) => w.kind === "place");
  const shops = wishes.filter((w) => w.kind === "shop");
  const [sheet, setSheet] = useState<null | "place" | "shop">(null);
  const [cur, setCur] = useState<Wish | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("");
  const [memo, setMemo] = useState("");
  const [link, setLink] = useState("");
  const [pic, setPic] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [st, setSt] = useState<St>("todo");
  const [group, setGroup] = useState("");
  const [newGroup, setNewGroup] = useState(false);
  const [pp, setPp] = useState<Wish | null>(null);
  const [busy, setBusy] = useState(false);
  const [share, setShare] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const groups = Array.from(new Set(shops.map((s) => s.shop_group || "")));
  groups.sort((a, b) => (a === "" ? 1 : b === "" ? -1 : 0));
  const preview = file ? URL.createObjectURL(file) : pic;

  function openPlace(w: Wish | null) {
    setCur(w);
    setName(w?.name ?? "");
    setKind(w?.category ? (wk(w.category)?.[0] ?? "") : "");
    setMemo(w?.memo ?? "");
    setLink(w?.link ?? "");
    setPic(w?.photos?.[0] ?? null);
    setFile(null);
    setShare(w ? w.shared !== false : false);
    setSheet("place");
  }
  function openShop(w: Wish | null) {
    setCur(w);
    setName(w?.name ?? "");
    setMemo(w?.memo ?? "");
    setPic(w?.photos?.[0] ?? null);
    setFile(null);
    setSt(stOf(w?.status ?? null));
    setGroup(
      w ? (w.shop_group ?? "") : (groups.filter(Boolean).slice(-1)[0] ?? ""),
    );
    setNewGroup(false);
    setShare(w ? w.shared !== false : false);
    setSheet("shop");
  }

  async function save() {
    if (!name.trim()) return toast("이름을 적어 주세요");
    setBusy(true);
    let photo = pic;
    if (file) {
      try {
        photo = await uploadPhoto(tripId, file);
      } catch {
        toast("사진을 올리지 못했어요");
      }
    }
    const isPlace = sheet === "place";
    const row: Record<string, unknown> = isPlace
      ? {
          trip_id: tripId,
          kind: "place",
          name: name.trim(),
          category: kind || null,
          memo: memo.trim() || null,
          link: link.trim() || null,
          photos: photo ? [photo] : [],
        }
      : {
          trip_id: tripId,
          kind: "shop",
          name: name.trim(),
          status: st,
          shop_group: group.trim() || null,
          memo: memo.trim() || null,
          photos: photo ? [photo] : [],
        };
    if (together && (!cur || cur.created_by === me)) row.shared = share;
    const supabase = createClient();
    const { error } = cur
      ? await supabase.from("wishes").update(row).eq("id", cur.id)
      : await supabase.from("wishes").insert(row);
    setBusy(false);
    if (error) return toast("저장하지 못했어요");
    const old = cur?.photos?.[0];
    if (old && old !== photo) removePhotos([old]);
    setSheet(null);
    toast(
      cur
        ? "저장했어요"
        : isPlace
          ? "가고싶은곳에 추가했어요"
          : "쇼핑 리스트에 추가했어요",
    );
    router.refresh();
  }

  async function remove() {
    if (
      !cur ||
      !(await askDel(`${cur.name}을(를) 삭제할까요?`, undefined, "삭제"))
    )
      return;
    const { error } = await createClient()
      .from("wishes")
      .delete()
      .eq("id", cur.id);
    if (error) return toast("지우지 못했어요");
    removePhotos(cur.photos || []);
    setSheet(null);
    toast("삭제했어요");
    router.refresh();
  }

  async function cycle(w: Wish) {
    const next = SEQ[(SEQ.indexOf(stOf(w.status)) + 1) % SEQ.length];
    await createClient().from("wishes").update({ status: next }).eq("id", w.id);
    router.refresh();
  }

  async function addToPlan(
    w: Wish,
    day: string | null,
    time: string,
    sort: number,
  ) {
    const { error } = await createClient()
      .from("events")
      .insert({
        trip_id: tripId,
        wish_id: w.id,
        title: w.name,
        category: wk(w.category)?.[2] ?? "기타",
        day,
        time_text: time || null,
        sort,
        memo: w.memo,
        link: w.link,
        photo: w.photos?.[0] ?? null,
      });
    if (error) return toast("일정에 넣지 못했어요");
    toast(
      day
        ? `DAY ${days.indexOf(day) + 1} 일정에 넣었어요`
        : "날짜 미정 일정에 넣었어요",
    );
    router.refresh();
  }

  const status = (w: Wish) =>
    w.id in planned
      ? planned[w.id]
        ? `DAY ${days.indexOf(planned[w.id]!) + 1}`
        : "날짜 미정"
      : "";

  return (
    <section className="screen on" id="wish">
      <div className="scr">
        <div className="hd">
          <TripTitle
            id={tripId}
            title={head.title}
            start={head.start_date}
            end={head.end_date}
            label="위시리스트"
          />
          <span
            className="ib"
            id="wishPlus"
            onClick={() => (tab === "shop" ? openShop(null) : openPlace(null))}
          >
            <Ic n="plus" />
          </span>
        </div>
        <div className="seg3 two">
          <Go className={tab === "place" ? "on" : ""} href="?tab=place" replace>
            가고싶은곳{places.length ? ` ${places.length}` : ""}
          </Go>
          <Go className={tab === "shop" ? "on" : ""} href="?tab=shop" replace>
            쇼핑{shops.length ? ` ${shops.length}` : ""}
          </Go>
        </div>
        <div className="pad" style={{ paddingBottom: 24 }}>
          {tab === "place" ? (
            <>
              <div className="wgrid">
                {places.map((w) => {
                  const s = status(w);
                  const k = wk(w.category);
                  return (
                    <div key={w.id} className="wc" onClick={() => openPlace(w)}>
                      <div className={`wp${w.photos?.[0] ? "" : " nopic"}`}>
                        {w.photos?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="im" src={w.photos[0]} alt="" />
                        ) : (
                          <Ic n={k?.[1] ?? "map-pin"} />
                        )}
                        {s && <span className="tag acc">{s}</span>}
                      </div>
                      <b>{w.name}</b>
                      <span>
                        {together && w.shared !== false && (
                          <em className="wshared">공유 · </em>
                        )}
                        {w.memo || k?.[0] || ""}
                      </span>
                      {!s && (
                        <em
                          onClick={(e) => {
                            e.stopPropagation();
                            setPp(w);
                          }}
                        >
                          <Ic n="plus" /> 일정
                        </em>
                      )}
                    </div>
                  );
                })}
              </div>
              {places.length === 0 && (
                <div
                  className="sub"
                  style={{ textAlign: "center", padding: "40px 0 10px" }}
                >
                  가고싶은곳이 없어요
                </div>
              )}
              <div
                className="addline"
                style={{ marginTop: 12 }}
                onClick={() => openPlace(null)}
              >
                <Ic n="plus" /> 가고싶은곳 추가
              </div>
            </>
          ) : (
            <>
              <div className="stlegend">
                <span>
                  <StIc s="todo" />찜
                </span>
                <span>
                  <StIc s="buy" />
                  구매완료
                </span>
                <span>
                  <StIc s="no" />제외
                </span>
              </div>
              {groups.map((g) => {
                const gs = shops.filter((w) => (w.shop_group || "") === g);
                const want = gs.filter((w) => stOf(w.status) !== "no");
                const got = want.filter((w) => stOf(w.status) === "buy").length;
                return (
                  <div key={g || "_"} style={{ display: "contents" }}>
                    <div className="stt row" style={{ marginTop: 14 }}>
                      {g || "미지정"}
                      <span
                        className="sub"
                        style={{ fontSize: 13, fontWeight: 700 }}
                      >
                        {got} / {want.length}
                      </span>
                    </div>
                    <div className="boxc shop">
                      {gs
                        .map((w, i) => [w, i] as const)
                        .sort(
                          ([a, ai], [b, bi]) =>
                            SEQ.indexOf(stOf(a.status)) -
                              SEQ.indexOf(stOf(b.status)) || ai - bi,
                        )
                        .map(([w]) => {
                          const s = stOf(w.status);
                          return (
                            <div
                              key={w.id}
                              onClick={() => openShop(w)}
                              style={{ cursor: "pointer" }}
                            >
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cycle(w);
                                }}
                                style={{ flex: "none", display: "flex" }}
                              >
                                <StIc s={s} />
                              </span>
                              {w.photos?.[0] && (
                                <em className="sth">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    className="im"
                                    src={w.photos[0]}
                                    alt=""
                                  />
                                </em>
                              )}
                              <span
                                className={`sn${s === "no" ? " strike" : ""}`}
                              >
                                <b>{w.name}</b>
                                {(w.memo ||
                                  (together && w.shared !== false)) && (
                                  <small>
                                    {together && w.shared !== false && (
                                      <em className="wshared">
                                        공유{w.memo ? " · " : ""}
                                      </em>
                                    )}
                                    {w.memo}
                                  </small>
                                )}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
              {shops.length === 0 && (
                <div
                  className="sub"
                  style={{ textAlign: "center", padding: "40px 0 10px" }}
                >
                  쇼핑 항목이 없어요
                </div>
              )}
              <div
                className="addline"
                id="shopAdd"
                style={{ marginTop: 12 }}
                onClick={() => openShop(null)}
              >
                <Ic n="plus" /> 쇼핑 항목 추가
              </div>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
      />

      <Sheet
        open={sheet === "place"}
        onClose={() => setSheet(null)}
        title={cur ? "가고싶은곳" : "가고싶은곳 추가"}
        id="wishItem"
      >
        <div
          className="wi-p"
          onClick={() => !preview && fileRef.current?.click()}
        >
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="im" src={preview} alt="" />
              <b
                className="wx-x"
                onClick={(e) => {
                  e.stopPropagation();
                  setPic(null);
                  setFile(null);
                }}
              >
                <Ic n="x" />
              </b>
            </>
          ) : (
            <div className="wi-add">
              <Ic n="image-plus" />
              <span>사진</span>
            </div>
          )}
        </div>
        <label className="flab">이름</label>
        <input
          className="inp wi-f"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="가게, 장소 이름"
        />
        <label className="flab">분류</label>
        <div
          className="chips flush wi-k"
          style={{ marginTop: 0, flexWrap: "wrap" }}
        >
          {WISH_KINDS.map(([k]) => (
            <span
              key={k}
              className={`chip${kind === k ? " on" : ""}`}
              onClick={() => setKind(kind === k ? "" : k)}
            >
              {k}
            </span>
          ))}
        </div>
        <label className="flab">메모</label>
        <textarea
          className="inp wi-f wi-memo"
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="동네, 먹을 것, 영업시간"
        />
        <label className="flab">링크</label>
        <div className="inp wi-f row">
          <Ic n="link" />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="인스타, 블로그 링크 붙여넣기"
            inputMode="url"
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              outline: 0,
              background: "none",
            }}
          />
          {link && /^https?:\/\//.test(link) && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="link"
              style={{ fontSize: 12.5, fontWeight: 700 }}
            >
              열기
            </a>
          )}
        </div>
        {cur && (
          <div className="wi-st">
            <Ic n="calendar-days" />
            <span>
              {status(cur)
                ? `${status(cur)} 일정에 있어요`
                : "아직 일정에 없어요"}
            </span>
          </div>
        )}
        {together && (!cur || cur.created_by === me) && (
          <div className="switches" style={{ marginTop: 14 }}>
            <div onClick={() => setShare(!share)}>
              <Ic n="users" />
              <span>전체공유</span>
              <i className={`sw${share ? " on" : ""}`} />
            </div>
          </div>
        )}
        <div className="btns2" id="wiBtns">
          <div onClick={() => !busy && save()}>
            {busy ? "저장 중" : cur ? "저장" : "추가"}
          </div>
          {cur &&
            (status(cur) ? (
              <Go
                href={`/trips/${tripId}/plan?day=${planned[cur.id] ?? "none"}`}
              >
                일정 보기
              </Go>
            ) : (
              <div
                onClick={() => {
                  setSheet(null);
                  setPp(cur);
                }}
              >
                <Ic n="calendar-days" /> 일정에 넣기
              </div>
            ))}
          {cur && (
            <div className="del" onClick={remove}>
              <Ic n="trash" />
            </div>
          )}
        </div>
      </Sheet>

      <Sheet
        open={sheet === "shop"}
        onClose={() => setSheet(null)}
        title={cur ? "쇼핑 항목" : "쇼핑 항목 추가"}
        id="shopItem"
      >
        <div
          className="wi-p si-p"
          onClick={() => !preview && fileRef.current?.click()}
        >
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="im" src={preview} alt="" />
              <b
                className="wx-x"
                onClick={(e) => {
                  e.stopPropagation();
                  setPic(null);
                  setFile(null);
                }}
              >
                <Ic n="x" />
              </b>
            </>
          ) : (
            <div className="wi-add">
              <Ic n="image-plus" />
              <span>사진</span>
            </div>
          )}
        </div>
        <label className="flab">이름</label>
        <input
          className="inp wi-f"
          autoFocus={!cur}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="상품 이름"
        />
        <label className="flab">상태</label>
        <div className="si-st">
          {(
            [
              ["todo", "찜"],
              ["buy", "구매완료"],
              ["no", "제외"],
            ] as [St, string][]
          ).map(([k, l]) => (
            <span
              key={k}
              className={st === k ? "on" : ""}
              onClick={() => setSt(k)}
            >
              <StIc s={k} />
              {l}
            </span>
          ))}
        </div>
        <label className="flab">구매장소</label>
        <div
          className="chips flush si-g"
          style={{ marginTop: 0, flexWrap: "wrap" }}
        >
          <span
            className={`chip${!newGroup && !group ? " on" : ""}`}
            onClick={() => (setGroup(""), setNewGroup(false))}
          >
            미지정
          </span>
          {groups.filter(Boolean).map((g) => (
            <span
              key={g}
              className={`chip${!newGroup && group === g ? " on" : ""}`}
              onClick={() => (setGroup(g), setNewGroup(false))}
            >
              {g}
            </span>
          ))}
          <span
            className={`chip${newGroup ? " on" : ""}`}
            onClick={() => (setNewGroup(true), setGroup(""))}
          >
            ＋ 새 구매장소
          </span>
        </div>
        {newGroup && (
          <input
            className="inp"
            autoFocus
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="예) 돈키호테, 드럭스토어"
            style={{ marginTop: 8 }}
          />
        )}
        <label className="flab">메모</label>
        <textarea
          className="inp wi-f wi-memo"
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="가격, 개수, 누구 선물"
        />
        {together && (!cur || cur.created_by === me) && (
          <div className="switches" style={{ marginTop: 14 }}>
            <div onClick={() => setShare(!share)}>
              <Ic n="users" />
              <span>전체공유</span>
              <i className={`sw${share ? " on" : ""}`} />
            </div>
          </div>
        )}
        <div className="btns2" id="siBtns">
          <div onClick={() => !busy && save()}>
            {busy ? "저장 중" : cur ? "저장" : "추가"}
          </div>
          {cur && (
            <div className="del" onClick={remove}>
              <Ic n="trash" />
            </div>
          )}
        </div>
      </Sheet>

      {pp && (
        <PlanPick
          open
          onClose={() => setPp(null)}
          title={pp.name}
          sub={pp.memo ?? undefined}
          days={days}
          events={events}
          onDone={(d, t, s) => addToPlan(pp, d, t, s)}
        />
      )}
    </section>
  );
}
