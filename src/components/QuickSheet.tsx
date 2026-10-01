"use client";

import Go from "@/components/Go";
import Ic, { type IcName } from "@/components/Ic";
import Sheet from "@/components/ui/Sheet";

export default function QuickSheet({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const b = `/trips/${id}`;
  const items: [string, IcName, string, string][] = [
    [`${b}/plan/new`, "calendar-days", "green", "일정"],
    [`${b}/money/new`, "receipt", "amber", "지출"],
    [`${b}/diary/write`, "square-pen", "violet", "기록"],
    [`${b}/bookings/new`, "ticket", "blue", "예약"],
    [`${b}/pack`, "luggage", "ink", "준비물"],
    [`${b}/wish`, "heart", "acc", "가고싶은곳"],
  ];
  return (
    <Sheet open={open} onClose={onClose} title="무엇을 추가할까요?" tall={false} id="quick">
      <div className="qgrid">
        {items.map(([href, n, c, l]) => (
          <Go key={href} href={href} onClick={onClose}>
            <span className={`mg-ic ${c}`}>
              <Ic n={n} />
            </span>
            {l}
          </Go>
        ))}
      </div>
    </Sheet>
  );
}
