import { Cloud, CloudRain, CloudSun, Snowflake, Sun } from "lucide-react";

const W = { sun: Sun, partly: CloudSun, cloud: Cloud, rain: CloudRain, snow: Snowflake } as const;

export default function WeatherIcon({ w, size = 18 }: { w: string | null; size?: number }) {
  if (!w) return null;
  const I = W[w as keyof typeof W];
  return I ? <I size={size} /> : null;
}
