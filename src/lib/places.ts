export type Country = { code: string; name: string; en: string; cur: string; region: "asia" | "europe" | "america" | "etc" };
export type Currency = { code: string; name: string; sym: string; unit: number; rate: number };

/** 나라 목록. 국기는 code로 flag-icons를 써요 */
export const COUNTRIES: Country[] = [
  { code: "jp", name: "일본", en: "Japan", cur: "JPY", region: "asia" },
  { code: "tw", name: "대만", en: "Taiwan", cur: "TWD", region: "asia" },
  { code: "th", name: "태국", en: "Thailand", cur: "THB", region: "asia" },
  { code: "vn", name: "베트남", en: "Vietnam", cur: "VND", region: "asia" },
  { code: "ph", name: "필리핀", en: "Philippines", cur: "PHP", region: "asia" },
  { code: "sg", name: "싱가포르", en: "Singapore", cur: "SGD", region: "asia" },
  { code: "hk", name: "홍콩", en: "Hong Kong", cur: "HKD", region: "asia" },
  { code: "cn", name: "중국", en: "China", cur: "CNY", region: "asia" },
  { code: "id", name: "인도네시아", en: "Indonesia", cur: "IDR", region: "asia" },
  { code: "my", name: "말레이시아", en: "Malaysia", cur: "MYR", region: "asia" },
  { code: "gb", name: "영국", en: "United Kingdom", cur: "GBP", region: "europe" },
  { code: "fr", name: "프랑스", en: "France", cur: "EUR", region: "europe" },
  { code: "it", name: "이탈리아", en: "Italy", cur: "EUR", region: "europe" },
  { code: "es", name: "스페인", en: "Spain", cur: "EUR", region: "europe" },
  { code: "de", name: "독일", en: "Germany", cur: "EUR", region: "europe" },
  { code: "ch", name: "스위스", en: "Switzerland", cur: "CHF", region: "europe" },
  { code: "cz", name: "체코", en: "Czechia", cur: "CZK", region: "europe" },
  { code: "at", name: "오스트리아", en: "Austria", cur: "EUR", region: "europe" },
  { code: "pt", name: "포르투갈", en: "Portugal", cur: "EUR", region: "europe" },
  { code: "us", name: "미국", en: "United States", cur: "USD", region: "america" },
  { code: "ca", name: "캐나다", en: "Canada", cur: "CAD", region: "america" },
  { code: "mx", name: "멕시코", en: "Mexico", cur: "MXN", region: "america" },
  { code: "gu", name: "괌", en: "Guam", cur: "USD", region: "america" },
  { code: "au", name: "호주", en: "Australia", cur: "AUD", region: "etc" },
  { code: "nz", name: "뉴질랜드", en: "New Zealand", cur: "NZD", region: "etc" },
  { code: "ae", name: "아랍에미리트", en: "UAE", cur: "AED", region: "etc" },
  { code: "tr", name: "튀르키예", en: "Türkiye", cur: "TRY", region: "etc" },
];

/** 대략적인 기본 환율 (직접 고쳐서 써요) */
export const CURRENCIES: Record<string, Currency> = {
  KRW: { code: "KRW", name: "원", sym: "₩", unit: 1, rate: 1 },
  JPY: { code: "JPY", name: "엔", sym: "¥", unit: 100, rate: 920 },
  USD: { code: "USD", name: "달러", sym: "$", unit: 1, rate: 1385 },
  TWD: { code: "TWD", name: "대만 달러", sym: "NT$", unit: 1, rate: 43 },
  THB: { code: "THB", name: "바트", sym: "฿", unit: 1, rate: 41 },
  VND: { code: "VND", name: "동", sym: "₫", unit: 1000, rate: 54 },
  PHP: { code: "PHP", name: "페소", sym: "₱", unit: 1, rate: 24 },
  SGD: { code: "SGD", name: "싱가포르 달러", sym: "S$", unit: 1, rate: 1060 },
  HKD: { code: "HKD", name: "홍콩 달러", sym: "HK$", unit: 1, rate: 177 },
  CNY: { code: "CNY", name: "위안", sym: "¥", unit: 1, rate: 192 },
  IDR: { code: "IDR", name: "루피아", sym: "Rp", unit: 1000, rate: 85 },
  MYR: { code: "MYR", name: "링깃", sym: "RM", unit: 1, rate: 310 },
  GBP: { code: "GBP", name: "파운드", sym: "£", unit: 1, rate: 1820 },
  EUR: { code: "EUR", name: "유로", sym: "€", unit: 1, rate: 1510 },
  CHF: { code: "CHF", name: "스위스 프랑", sym: "CHF ", unit: 1, rate: 1600 },
  CZK: { code: "CZK", name: "코루나", sym: "Kč", unit: 1, rate: 60 },
  CAD: { code: "CAD", name: "캐나다 달러", sym: "C$", unit: 1, rate: 1010 },
  MXN: { code: "MXN", name: "페소", sym: "Mex$", unit: 1, rate: 75 },
  AUD: { code: "AUD", name: "호주 달러", sym: "A$", unit: 1, rate: 910 },
  NZD: { code: "NZD", name: "뉴질랜드 달러", sym: "NZ$", unit: 1, rate: 830 },
  AED: { code: "AED", name: "디르함", sym: "AED ", unit: 1, rate: 377 },
  TRY: { code: "TRY", name: "리라", sym: "₺", unit: 1, rate: 40 },
};

export const CITY_GROUPS: { region: string; cities: string[] }[] = [
  { region: "서울·경기", cities: ["서울", "인천", "수원", "가평", "파주"] },
  { region: "강원", cities: ["강릉", "속초", "양양", "춘천", "평창"] },
  { region: "충청·전라", cities: ["대전", "전주", "여수", "순천", "군산", "목포"] },
  { region: "경상", cities: ["부산", "경주", "대구", "통영", "거제", "포항", "안동"] },
  { region: "제주", cities: ["제주시", "서귀포", "우도"] },
];

export const COVER_COLORS = ["#4DA3FF", "#5E626B", "#F5BE4E", "#34496E", "#E0A3A0", "#5A9277", "#9A8BC4", "#4F8FAE"];

export const MEMBER_COLORS = ["#E48AA3", "#E0A03A", "#5FA886", "#4DA3FF", "#9A8BC4", "#4B4E56"];

export const CATEGORIES = [
  { key: "관광지", color: "#3E9A6A" },
  { key: "음식점", color: "#E5574A" },
  { key: "카페", color: "#E0A03A" },
  { key: "숙소", color: "#9A8BC4" },
  { key: "쇼핑", color: "#C86FB0" },
  { key: "교통", color: "#4DA3FF" },
  { key: "체험", color: "#2FA3A3" },
  { key: "기타", color: "#8B95A1" },
];

export const catColor = (c: string) => CATEGORIES.find((x) => x.key === c)?.color ?? "#8B95A1";

export const MOVES = [
  { key: "walk", label: "도보" },
  { key: "transit", label: "대중교통" },
  { key: "taxi", label: "택시" },
  { key: "car", label: "차" },
];

export function country(code: string) {
  return COUNTRIES.find((c) => c.code === code);
}
