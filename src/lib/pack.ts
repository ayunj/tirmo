import type { IcName } from "@/components/Ic";

export const PACK_CATS = ["필수", "전자기기", "의류 · 생활", "세면", "상비약", "기타"];
export const PACK_IC: Record<string, IcName> = { 필수: "file-check", 전자기기: "plug", "의류 · 생활": "shirt", 세면: "droplets", 상비약: "plus", 기타: "luggage" };

export const PACK_TEMPLATE: Record<string, string[]> = {
  필수: ["여권", "항공권 (모바일 체크인)", "숙소 바우처", "환전 · 트래블카드", "여행자 보험"],
  전자기기: ["휴대폰", "충전기 · 보조배터리", "멀티어댑터 (돼지코)", "eSIM · 유심"],
  "의류 · 생활": ["캐리어", "갈아입을 옷", "잠옷", "편한 신발", "우산"],
  세면: ["칫솔 · 치약", "클렌징폼", "선크림"],
  상비약: ["소화제", "진통제", "밴드"],
};
