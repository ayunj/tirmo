import type { IcName } from "@/components/Ic";

/** 일정 분류 → 목업 색 이름 · 아이콘 */
export const EV_CATS: { key: string; dot: string; evi: string; tag: string; ic: IcName }[] = [
  { key: "관광지", dot: "green", evi: "green", tag: "green", ic: "camera" },
  { key: "음식점", dot: "acc", evi: "acc", tag: "acc", ic: "utensils" },
  { key: "카페", dot: "amberc", evi: "cafe", tag: "amber", ic: "coffee" },
  { key: "숙소", dot: "violet", evi: "violet", tag: "violet", ic: "bed-double" },
  { key: "쇼핑", dot: "shopc", evi: "shop", tag: "violet", ic: "shopping-bag" },
  { key: "교통", dot: "blue", evi: "blue", tag: "blue", ic: "train-front" },
  { key: "체험", dot: "green", evi: "green", tag: "green", ic: "ticket" },
  { key: "기타", dot: "blue", evi: "blue", tag: "blue", ic: "map-pin" },
];
export const evCat = (k: string) => EV_CATS.find((c) => c.key === k) ?? EV_CATS[EV_CATS.length - 1];

export const MOVE_IC: Record<string, IcName> = { flight: "plane", walk: "footprints", transit: "bus", taxi: "car-taxi-front", car: "car" };
export const MOVE_LABEL: Record<string, string> = { flight: "비행", walk: "도보", transit: "대중교통", taxi: "택시", car: "차" };
