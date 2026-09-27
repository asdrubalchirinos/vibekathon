import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/";
  const next = nextRaw.startsWith("/") ? nextRaw : "/";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (user) {
        // Actualiza usuario/avatar por si GitHub los cambió.
        await supabase.from("profiles").upsert({
          id: user.id,
          github_username:
            (user.user_metadata?.user_name as string | undefined) ||
            (user.user_metadata?.preferred_username as string | undefined) ||
            null,
          avatar_url: (user.user_metadata?.avatar_url as string | undefined) || null,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
