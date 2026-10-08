export type Profile = {
  id: string;
  nickname: string;
  color: string;
  onboarded: boolean;
};

export type Trip = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  kind: "abroad" | "domestic";
  countries: string[];
  cities: string[];
  cover_color: string;
  cover_photo: string | null;
  currency: string;
  rate_unit: number;
  rate: number;
  invite_code: string;
  created_by: string;
};

export type Member = {
  user_id: string;
  role: "owner" | "editor" | "viewer";
  joined_at?: string;
  profiles: Pick<Profile, "nickname" | "color"> | null;
};

export type EventRow = {
  id: string;
  trip_id: string;
  day: string | null;
  time_text: string | null;
  sort: number;
  title: string;
  category: string;
  memo: string | null;
  address: string | null;
  link: string | null;
  photo: string | null;
  move_mode: string | null;
  move_note: string | null;
  booking_id: string | null;
  wish_id: string | null;
  booking_ids?: string[];
  wish_ids?: string[];
};

export type BookingKind = "flight" | "hotel" | "car" | "restaurant" | "tour" | "etc";
export type Booking = {
  id: string;
  trip_id: string;
  kind: BookingKind;
  title: string;
  status: string | null;
  details: Record<string, string>;
  amount: number | null;
  currency: string | null;
  memo: string | null;
  link: string | null;
  photos: string[];
  sort_key: string | null;
};

export type Pocket = {
  id: string;
  trip_id: string;
  name: string;
  kind: "cash" | "card" | "bank";
  currency: string;
  budget: number;
  shared: boolean;
  owner_id: string | null;
};

export type Expense = {
  id: string;
  trip_id: string;
  pocket_id: string | null;
  payer_id: string | null;
  amount: number;
  currency: string;
  category: string;
  title: string;
  day: string | null;
  time_text: string | null;
  memo: string | null;
  split: { members: string[]; mode?: "eq" | "own"; shares?: Record<string, number> } | null;
  booking_id: string | null;
  photos?: string[];
  created_by?: string | null;
};

export type Topup = { id: string; trip_id: string; pocket_id: string; amount: number; how: string | null; day: string | null; rate_text: string | null; krw: number | null; memo: string | null; created_at: string };

export type Transfer = { id: string; trip_id: string; from_id: string; to_id: string; amount: number; created_at: string };

export type PackItem = {
  id: string;
  trip_id: string;
  category: string;
  name: string;
  done: boolean;
  pinned: boolean;
  assignee: string | null;
  booking_id: string | null;
  memo: string | null;
  sort: number;
};

export type Wish = {
  id: string;
  trip_id: string;
  kind: "place" | "shop";
  name: string;
  category: string | null;
  memo: string | null;
  link: string | null;
  address: string | null;
  photos: string[];
  status: string | null;
  shop_group: string | null;
  shared?: boolean;
  created_by?: string | null;
};

export type Entry = {
  id: string;
  trip_id: string;
  event_id: string | null;
  title: string | null;
  body: string | null;
  mood: string | null;
  weather: string | null;
  place: string | null;
  day: string | null;
  time_text: string | null;
  photos: string[];
  in_pdf: boolean;
  created_by: string | null;
};
