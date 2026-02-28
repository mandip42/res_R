"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Logo } from "@/components/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-8">
      <nav className="absolute left-4 top-6 w-full max-w-md md:left-8 md:top-8 md:max-w-none">
        <Logo height={32} width={160} />
      </nav>
      <Card className="w-full max-w-md border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle className="text-center text-lg font-semibold">
            Forgot password?
          </CardTitle>
          <p className="text-center text-xs text-muted-foreground">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Check your inbox for <strong className="text-foreground">{email}</strong>. Click the link in the email to set a new password.
              </p>
              <p className="text-xs text-muted-foreground">
                Didn&apos;t get it? Check spam or{" "}
                <button
                  type="button"
                  onClick={() => { setSent(false); setError(null); }}
                  className="text-primary hover:underline"
                >
                  try again
                </button>
                .
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Back to log in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}

          {error && (
            <p className="mt-3 text-center text-xs text-red-400">{error}</p>
          )}

          {!sent && (
            <div className="mt-4 text-center text-xs text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                ← Back to log in
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
