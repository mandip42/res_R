import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEV_ADMIN_EMAILS = [
  "mandipgoswami25@gmail.com",
  "mandipgoswami@gmail.com",
  "ritusmitabaruah18@gmail.com",
];

function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  // Dev admin list works in both dev and production so plan switcher works on deployed app
  if (DEV_ADMIN_EMAILS.includes(normalized)) return true;
  const single = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (single && single === normalized) return true;
  const list =
    process.env.ADMIN_EMAILS?.toLowerCase()
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean) ?? [];
  return list.includes(normalized);
}

/** Dev-only endpoint to flip the current user's plan between free/pro/lifetime for testing. */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const plan = (body?.plan as string | undefined)?.toLowerCase().trim();

    if (plan !== "free" && plan !== "pro" && plan !== "lifetime") {
      return NextResponse.json(
        { error: "Plan must be one of: free, pro, lifetime." },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        plan,
      });
      if (insertError) {
        console.error("Dev plan insert error", insertError);
        return NextResponse.json(
          { error: "Failed to set plan" },
          { status: 500 }
        );
      }
    } else {
      const { error: updateError } = await supabase
        .from("users")
        .update({ plan })
        .eq("id", user.id);
      if (updateError) {
        console.error("Dev plan update error", updateError);
        return NextResponse.json(
          { error: "Failed to set plan" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, plan }, { status: 200 });
  } catch (err) {
    console.error("Dev plan error", err);
    return NextResponse.json(
      { error: "Failed to set plan" },
      { status: 500 }
    );
  }
}

