import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** Returns the current user's profile (username, full_name) from public.users for display in the nav. */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("username, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    user: {
      email: user.email,
      username: profile?.username ?? user.user_metadata?.username ?? null,
      full_name: profile?.full_name ?? user.user_metadata?.full_name ?? null,
    },
  });
}
