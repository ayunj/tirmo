import type { IcName } from "@/components/Ic";

/** 가고싶은곳 분류 → 아이콘 · 일정 분류 */
export const WISH_KINDS: [string, IcName, string][] = [
  ["맛집", "utensils", "음식점"],
  ["카페", "coffee", "카페"],
  ["간식", "coffee", "카페"],
  ["관광", "camera", "관광지"],
  ["쇼핑", "shopping-bag", "쇼핑"],
  ["기타", "map-pin", "기타"],
];
export const wishKind = (k: string | null) => WISH_KINDS.find((x) => x[0] === k || x[2] === k);
