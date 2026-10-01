import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // 서버 컴포넌트에서는 쿠키를 못 써요. 미들웨어가 대신 갱신해요.
          }
        },
      },
    }
  );
}

/** 로그인한 사람 (미들웨어가 이미 확인했으니 쿠키만 읽어요, 왕복 없음) */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { supabase, user: session?.user ?? null };
}

/** 로그인한 사람과 프로필. 없으면 null */
export async function getMe() {
  const { supabase, user } = await getSessionUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { supabase, user, profile };
}
