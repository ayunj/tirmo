import type { SupabaseClient } from "@supabase/supabase-js";

/** 전에 간 나라 · 도시 (최근 순) */
export async function recentPlaces(supabase: SupabaseClient, skip?: string) {
  const { data } = await supabase.from("trips").select("id, kind, countries, cities, start_date").order("start_date", { ascending: false, nullsFirst: false }).limit(30);
  const rows = (data ?? []).filter((t) => t.id !== skip);
  const cs: string[] = [];
  const ci: string[] = [];
  for (const t of rows) {
    if (t.kind === "abroad") for (const c of t.countries as string[]) if (!cs.includes(c)) cs.push(c);
    if (t.kind === "domestic") for (const c of t.cities as string[]) if (!ci.includes(c)) ci.push(c);
  }
  return { recentCountries: cs, recentCities: ci };
}
