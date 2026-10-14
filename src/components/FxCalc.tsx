"use client";

import { useEffect, useState } from "react";

/** 여행 홈 환전 계산: 현지 돈 → 현금 · 카드(수수료 포함) 원화 */
export default function FxCalc({ sym, rate, unit }: { sym: string; rate: number; unit: number }) {
  const [amt, setAmt] = useState("");
  const [fee, setFee] = useState("2.3");
  useEffect(() => {
    try {
      const v = localStorage.getItem("fx-fee");
      if (v) setFee(v);
    } catch {}
  }, []);
  const a = Number(amt.replace(/[^\d.]/g, "")) || 0;
  const f = Number(fee) || 0;
  const cash = (a * rate) / (unit || 1);
  const card = cash * (1 + f / 100);
  const won = (n: number) => (a ? `${Math.round(n).toLocaleString("ko-KR")}원` : "—");
  return (
    <div className="fx3">
      <label className="fx3-in">
        <span>{sym}</span>
        <input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="금액 입력" aria-label="현지 금액" />
      </label>
      <div className="fx3-out">
        <div>
          <span>💵 현금</span>
          <b className="num">{won(cash)}</b>
        </div>
        <div>
          <span>
            💳 카드 +
            <input
              className="fx3-fee"
              inputMode="decimal"
              value={fee}
              aria-label="카드 수수료 퍼센트"
              onChange={(e) => {
                setFee(e.target.value);
                try {
                  localStorage.setItem("fx-fee", e.target.value);
                } catch {}
              }}
            />
            %
          </span>
          <b className="num">{won(card)}</b>
        </div>
      </div>
    </div>
  );
}
