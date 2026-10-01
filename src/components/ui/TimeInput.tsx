"use client";

/** 숫자만 받아서 ':' 를 자동으로 넣어요. 710 → 7:10, 1240 → 12:40 */
export function typeTime(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return d.length === 3 ? `${d[0]}:${d.slice(1)}` : `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** 다 쓰고 나면 07:10 꼴로 맞추기 (틀린 시간은 비워요) */
export function finishTime(v: string) {
  const d = v.replace(/\D/g, "");
  if (!d) return "";
  let h: number, m: number;
  if (d.length <= 2) {
    h = +d;
    m = 0;
  } else if (d.length === 3) {
    h = +d[0];
    m = +d.slice(1);
  } else {
    h = +d.slice(0, 2);
    m = +d.slice(2, 4);
  }
  if (h > 23 || m > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { value: string; onChange: (v: string) => void; onDone?: (v: string) => void };

export default function TimeInput({ value, onChange, onDone, onBlur, placeholder = "예) 2130", ...rest }: Props) {
  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      pattern="[0-9:]*"
      autoComplete="off"
      maxLength={5}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(typeTime(e.target.value))}
      onBlur={(e) => {
        const v = finishTime(value);
        if (v !== value) onChange(v);
        onDone?.(v);
        onBlur?.(e);
      }}
    />
  );
}
