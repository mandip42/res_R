import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Delete the current user's account and all associated data. */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Account delete: missing Supabase service role env vars");
      return NextResponse.json(
        { error: "Server is misconfigured for account deletion." },
        { status: 500 },
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const userId = user.id;

    // Delete profile row (roasts cascade via FK)
    const { error: profileError } = await adminClient
      .from("users")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Account delete: failed to delete profile", profileError);
      return NextResponse.json(
        { error: "Failed to delete account data. Please try again." },
        { status: 500 },
      );
    }

    // Delete auth user
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("Account delete: failed to delete auth user", authError);
      return NextResponse.json(
        { error: "Failed to delete account user. Please try again." },
        { status: 500 },
      );
    }

    // Best-effort: sign out on the client by expiring cookies
    const response = NextResponse.json({ ok: true });
    response.cookies.set("sb-access-token", "", { maxAge: 0, path: "/" });
    response.cookies.set("sb-refresh-token", "", { maxAge: 0, path: "/" });

    return response;
  } catch (err) {
    console.error("Account delete error", err);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again." },
      { status: 500 },
    );
  }
}

