import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const raw = searchParams.get("next") || "/";
  const next = raw.startsWith("/") ? raw : "/";

  if (!code) return NextResponse.redirect(`${origin}/login?error=1`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=1`);

  // 처음이면 이름 정하기부터
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: p } = await supabase.from("profiles").select("onboarded").eq("id", user.id).maybeSingle();
    if (!p?.onboarded) return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
