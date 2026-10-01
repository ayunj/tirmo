"use client";

/** 글자 길이에 딱 맞게 늘어나는 입력칸 (금액을 가운데 맞출 때) */
export default function FitInput({ style, value, placeholder, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { value: string }) {
  const font = { fontSize: style?.fontSize, fontWeight: style?.fontWeight, letterSpacing: style?.letterSpacing, fontFamily: "inherit" };
  return (
    <span style={{ display: "inline-grid", marginTop: style?.marginTop }}>
      <span aria-hidden style={{ ...font, gridArea: "1 / 1", visibility: "hidden", whiteSpace: "pre", padding: "0 2px" }}>{value || placeholder || " "}</span>
      <input size={1} {...rest} value={value} placeholder={placeholder} style={{ ...style, marginTop: 0, gridArea: "1 / 1", width: "100%", minWidth: 0, padding: 0, textAlign: "center" }} />
    </span>
  );
}
