"use client";

/** 화면 아래에 붙는 저장 버튼. 바뀐 게 있을 때만 눌러져요 */
export default function SaveBar({ on, busy, onSave, label = "저장" }: { on: boolean; busy?: boolean; onSave: () => void; label?: string }) {
  const ok = on && !busy;
  return (
    <div className="savebar">
      <div className={`bigbtn${ok ? "" : " off"}`} onClick={() => ok && onSave()}>
        {busy ? "저장 중…" : label}
      </div>
    </div>
  );
}
