"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

      const res = await fetch("/api/auth/exchange-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const data = await res.json();
        setStatus("error");
        router.replace(`/login?error=${encodeURIComponent(data?.error ?? "Invalid link")}`);
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
