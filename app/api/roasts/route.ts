import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** GET: list past roasts for the current user (newest first). */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: roasts, error } = await supabase
    .from("roasts")
    .select("id, created_at, score, status, result_json")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Roasts list error", error);
    return NextResponse.json({ error: "Failed to load roasts" }, { status: 500 });
  }

  const list = (roasts ?? []).map((r) => {
    const result = r.result_json as { one_liner?: string } | null;
    return {
      id: r.id,
      created_at: r.created_at,
      score: r.score,
      status: r.status,
      one_liner: result?.one_liner ?? null,
    };
  });

  return NextResponse.json({ roasts: list });
}
