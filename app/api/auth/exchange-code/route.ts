import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

/**
 * Exchange the auth code for a session (e.g. after password reset or email confirm).
 * Runs on the server so it can read the PKCE code_verifier from the request cookies,
 * which fixes "PKCE code verifier not found" when the user opens the link in the same browser.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const code = body?.code as string | undefined;

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return response;
}
