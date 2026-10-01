import { ArrowLeftRight, Banknote, BedDouble, Car, Coffee, CreditCard, Ellipsis, Landmark, Plane, ShoppingBag, Ticket, TrainFront, Utensils } from "lucide-react";

export const BOOKING_ICON = { flight: Plane, hotel: BedDouble, car: Car, restaurant: Utensils, tour: Ticket, etc: Ellipsis } as const;
export const POCKET_ICON = { cash: Banknote, card: CreditCard, bank: Landmark } as const;

export function BookingIcon({ kind, size = 20 }: { kind: string; size?: number }) {
  const I = BOOKING_ICON[kind as keyof typeof BOOKING_ICON] ?? Ellipsis;
  return <I size={size} />;
}

export const EXP_ICON: Record<string, typeof Coffee> = { 식비: Utensils, 카페: Coffee, 교통: TrainFront, 쇼핑: ShoppingBag, 숙소: BedDouble, 관광: Ticket, 항공: Plane, 기타: Ellipsis, 정산: ArrowLeftRight };
export function ExpIcon({ cat, size = 20 }: { cat: string; size?: number }) {
  const I = EXP_ICON[cat] ?? Ellipsis;
  return <I size={size} />;
}
