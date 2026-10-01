import Ic from "@/components/Ic";
import { weather } from "@/lib/diary";

export default function WeatherIcon({ w }: { w: string | null; size?: number }) {
  const x = weather(w);
  return x ? <Ic n={x.ic} /> : null;
}
