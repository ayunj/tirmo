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
};
