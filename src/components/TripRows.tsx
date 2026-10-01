"use client";

import { Fragment, useState } from "react";
import Go from "@/components/Go";
import Ic from "@/components/Ic";
import { RowFlags } from "@/components/TripFlags";
import { ct } from "@/lib/cover";
import type { Trip } from "@/lib/types";

type R = { id: string; year: string; title: string; sub: string; label: string; color: string; trip: Pick<Trip, "kind" | "countries" | "cities"> };

/** 지난 여행: 처음 5개만, 나머지는 '더 보기' */
export default function TripRows({ rows }: { rows: R[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 5);
  let last = "";
  return (
    <>
      {shown.map((r) => {
        const yr = r.year !== last ? (last = r.year) : null;
        return (
          <Fragment key={r.id}>
            {yr && <div className="yr">{yr}</div>}
            <Go className="trow" href={`/trips/${r.id}`}>
              <div className="th ctile" style={ct(r.color)}>
                <span>{r.label}</span>
              </div>
              <div className="mid">
                <b>{r.title}</b>
                <div className="s">{r.sub}</div>
              </div>
              <RowFlags trip={r.trip} />
            </Go>
          </Fragment>
        );
      })}
      {rows.length > 5 && !all && (
        <div className="more-link" id="moreTripsBtn" onClick={() => setAll(true)}>
          지난 여행 {rows.length - 5}개 더 보기 <Ic n="chevron-down" />
        </div>
      )}
    </>
  );
}
