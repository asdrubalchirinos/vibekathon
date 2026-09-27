import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import type { Profile } from "./types";

export type CurrentUser = {
  id: string;
  profile: Profile | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, github_username, avatar_url, created_at")
    .eq("id", data.user.id)
    .maybeSingle();

  return { id: data.user.id, profile: profile as Profile | null };
}
