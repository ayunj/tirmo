"use client";

import { useEffect, useRef, useState } from "react";
import { bindUi } from "@/lib/ui";

export default function Overlay() {
  const [ask, setAsk] = useState<{ t: string; sub?: string; yes?: string; resolve: (v: boolean) => void } | null>(null);
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    bindUi(setAsk, (t) => {
      setMsg(t);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMsg(""), 1600);
    });
    return () => bindUi(null, null);
  }, []);
  const done = (v: boolean) => {
    ask?.resolve(v);
    setAsk(null);
  };
  return (
    <>
      <div className={`cfm${ask ? " on" : ""}`} onClick={(e) => e.target === e.currentTarget && done(false)}>
        {ask && (
          <div className="cfm-b">
            <b>{ask.t}</b>
            {ask.sub && <p>{ask.sub}</p>}
            <div className="cfm-btn">
              <span onClick={() => done(false)}>취소</span>
              <span data-cfm="yes" onClick={() => done(true)}>
                {ask.yes}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="toast" style={{ display: msg ? "block" : "none" }}>
        {msg}
      </div>
    </>
  );
}
