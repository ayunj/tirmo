import type { IcName } from "@/components/Ic";

export const MOODS: [string, string][] = [
  ["😊", "좋았어"],
  ["🥰", "설렘"],
  ["😌", "여유"],
  ["😪", "피곤"],
  ["🥲", "아쉬움"],
];
export const WEATHERS: { key: string; label: string; ic: IcName }[] = [
  { key: "sun", label: "맑음", ic: "sun" },
  { key: "partly", label: "구름 조금", ic: "cloud-sun" },
  { key: "cloud", label: "흐림", ic: "cloud" },
  { key: "rain", label: "비", ic: "cloud-rain" },
  { key: "snow", label: "눈", ic: "snowflake" },
];
export const weather = (k: string | null) => WEATHERS.find((w) => w.key === k);
