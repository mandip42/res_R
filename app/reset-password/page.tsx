"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Logo } from "@/components/logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");

      if (code) {
        const supabase = createSupabaseBrowserClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          setLoading(false);
          return;
        }
        await fetch("/api/auth/sync-profile", { method: "POST" });
      } else {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login?error=reset_link_expired");
          return;
        }
      }

      setReady(true);
      setLoading(false);
    };

    run();
  }, [router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setSubmitting(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Logo height={32} width={160} className="mb-6" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!ready && error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <Logo height={32} width={160} className="mb-6" />
        <p className="text-center text-sm text-red-400">{error}</p>
        <Button asChild variant="outline">
          <Link href="/login">Back to log in</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-8">
      <nav className="absolute left-4 top-6 w-full max-w-md md:left-8 md:top-8 md:max-w-none">
        <Logo height={32} width={160} />
      </nav>
      <Card className="w-full max-w-md border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle className="text-center text-lg font-semibold">
            Set new password
          </CardTitle>
          <p className="text-center text-xs text-muted-foreground">
            Enter your new password below.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                placeholder="Same as above"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Updating…" : "Update password"}
            </Button>
          </form>

          {error && (
            <p className="mt-3 text-center text-xs text-red-400">{error}</p>
          )}

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              ← Back to log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
