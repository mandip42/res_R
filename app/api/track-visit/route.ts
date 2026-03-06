import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COOKIE_NAME = "whiy_vid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** POST: record a page visit. Optional body: { path: string }. Sets visitor cookie if missing. */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return new NextResponse(null, { status: 204 });
  }

  let visitorId = req.cookies.get(COOKIE_NAME)?.value?.trim();
  if (!visitorId || visitorId.length > 64) {
    visitorId = randomUUID();
  }

  let path = "/";
  try {
    const body = await req.json().catch(() => null);
    if (body && typeof body.path === "string" && body.path.length <= 500) {
      path = body.path;
    }
  } catch {
    // keep default path
  }

  const adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await adminClient.from("visits").insert({
    path,
    visitor_id: visitorId,
  });

  const res = new NextResponse(null, { status: 204 });
  if (!req.cookies.get(COOKIE_NAME)) {
    res.cookies.set(COOKIE_NAME, visitorId, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}
