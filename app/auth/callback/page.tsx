"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");
      const next = searchParams.get("next") ?? "/dashboard";

      if (!code) {
        setStatus("error");
        router.replace("/login?error=missing_code");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setStatus("error");
        router.replace(`/login?error=${encodeURIComponent(error.message)}`);
        return;
      }

      await fetch("/api/auth/sync-profile", { method: "POST" });
      setStatus("ok");
      router.replace(next);
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
