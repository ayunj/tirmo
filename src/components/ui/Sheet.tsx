"use client";

import Ic from "@/components/Ic";

/** 아래에서 올라오는 창 (목업 qsheet) */
export default function Sheet({ open, onClose, title, tall = true, children, id, className }: { className?: string; open: boolean; onClose: () => void; title?: React.ReactNode; tall?: boolean; children: React.ReactNode; id?: string }) {
  if (!open) return null;
  return (
    <div className={`qsheet on${className ? " " + className : ""}`} id={id} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`in${tall ? " tall" : ""}`}>
        <div className="grab" />
        {title !== undefined && (
          <div className="row">
            {typeof title === "string" ? <b style={{ fontSize: 17 }}>{title}</b> : title}
            <span className="ib" onClick={onClose}>
              <Ic n="x" />
            </span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
