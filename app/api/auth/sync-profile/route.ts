import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** Syncs auth user's metadata (full_name, username) to public.users. Call after signup or login. */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const meta = user.user_metadata ?? {};
  const full_name = (meta.full_name as string)?.trim() || null;
  const username = typeof meta.username === "string" ? meta.username.trim() || null : null;

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    const updates: { full_name?: string; username?: string } = {};
    if (full_name != null) updates.full_name = full_name;
    if (username != null) updates.username = username;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true });
    }
    const { error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);
    if (updateError) {
      if (updateError.code === "23505")
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
      console.error("Sync profile update error", updateError);
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }
  } else {
    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      email: user.email ?? "",
      full_name: full_name ?? undefined,
      username: username ?? undefined,
      plan: "free",
    });
    if (insertError) {
      if (insertError.code === "23505")
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
      console.error("Sync profile insert error", insertError);
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
