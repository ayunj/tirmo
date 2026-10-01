import Ic from "@/components/Ic";
import type { Trip } from "@/lib/types";

/** 커버 위 국기 (국내면 도시 이름) */
export function CvFlags({ trip, up }: { trip: Pick<Trip, "kind" | "countries" | "cities">; up?: boolean }) {
  if (trip.kind === "domestic") {
    const cs = trip.cities;
    if (!cs.length) return null;
    return (
      <div className={`cvflags${up ? " up" : ""}`}>
        {cs.slice(0, 4).map((c) => (
          <span key={c} className="cvcity">
            {c}
          </span>
        ))}
        {cs.length > 4 && <span className="cvcity">+{cs.length - 4}</span>}
      </div>
    );
  }
  if (!trip.countries.length) return null;
  return (
    <div className={`cvflags${up ? " up" : ""}`}>
      {trip.countries.slice(0, 4).map((c) => (
        <span key={c} className={`fi fi-${c} flag`} />
      ))}
      {trip.countries.length > 4 && <span className="more">+{trip.countries.length - 4}</span>}
    </div>
  );
}

/** 목록 오른쪽 작은 국기 */
export function RowFlags({ trip }: { trip: Pick<Trip, "kind" | "countries" | "cities"> }) {
  if (trip.kind === "domestic")
    return trip.cities.length ? (
      <div className="tfl r">
        <span className="tcity">
          <Ic n="map-pin" />
          {trip.cities[0]}
        </span>
      </div>
    ) : null;
  return (
    <div className="tfl r">
      {trip.countries.slice(0, 3).map((c) => (
        <span key={c} className={`fi fi-${c} flag`} />
      ))}
    </div>
  );
}

export function Names({ list, oncv, add, style, xs }: { list: { nickname: string; color: string }[]; oncv?: boolean; add?: boolean; style?: React.CSSProperties; xs?: boolean }) {
  return (
    <span className={`names${oncv ? " oncv" : ""}${xs ? " xs" : ""}`} style={style}>
      {list.map((m, i) => (
        <span key={i} className="nm" style={{ background: m.color }}>
          {m.nickname}
        </span>
      ))}
      {add && (
        <span className="nm add">
          <Ic n="plus" />
        </span>
      )}
    </span>
  );
}
