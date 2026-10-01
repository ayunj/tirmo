import Go from "@/components/Go";
import Ic from "@/components/Ic";
import { range } from "@/lib/format";

/** 메뉴 화면 위쪽: 여행 이름 + 메뉴 · 날짜 (일정 화면과 같은 모양). 누르면 여행 목록 */
export default function TripTitle({ title, start, end, label }: { title: string; start: string | null; end: string | null; label?: string }) {
  return (
    <Go style={{ flex: 1, minWidth: 0 }} href="/">
      <h2 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {title} <Ic n="chevron-down" />
      </h2>
      <div className="sub">{[label, range(start, end)].filter(Boolean).join(" · ")}</div>
    </Go>
  );
}
