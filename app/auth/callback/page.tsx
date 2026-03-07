"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getTokensFromHash, clearAuthHash } from "@/lib/auth-hash";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");
      const next = searchParams.get("next") ?? "/dashboard";
      let hadCode = false;

      // 1) PKCE: exchange code for session (works when link opened in same browser)
      if (code) {
        hadCode = true;
        const res = await fetch("/api/auth/exchange-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (res.ok) {
          await fetch("/api/auth/sync-profile", { method: "POST" });
          setStatus("ok");
          router.replace(next);
          return;
        }
        const data = await res.json();
        // If exchange failed (e.g. different browser / no code_verifier), try hash below
        if (res.status !== 400) {
          setStatus("error");
          router.replace(`/login?error=${encodeURIComponent(data?.error ?? "Invalid link")}`);
          return;
        }
      }

      // 2) Token-in-hash: set session from URL fragment (e.g. link opened in different browser)
      const tokens = getTokensFromHash();
      if (tokens) {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });
          if (sessionError) {
            setStatus("error");
            clearAuthHash();
            router.replace(`/login?error=${encodeURIComponent(sessionError.message)}`);
            return;
          }
          clearAuthHash();
          await fetch("/api/auth/sync-profile", { method: "POST" });
          setStatus("ok");
          router.replace(next);
          return;
        } catch {
          setStatus("error");
          clearAuthHash();
          router.replace("/login?error=invalid_link");
          return;
        }
      }

      setStatus("error");
      const errMsg = hadCode
        ? "Open the link in the same browser where you signed up, or request a new confirmation email."
        : "Invalid or expired link. Request a new email.";
      router.replace(`/login?error=${encodeURIComponent(errMsg)}`);
    };

    run();
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        {status === "loading" && (
          <p className="text-sm text-muted-foreground">
            Confirming your email…
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-400">
            Something went wrong. Try logging in.
          </p>
        )}
      </div>
    </main>
  );
}
