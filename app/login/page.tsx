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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // User can enter either email or username
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      setError(
        err === "callback"
          ? "Email confirmation failed or link expired."
          : decodeURIComponent(err)
      );
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoadingPassword(true);
    setError(null);

    try {
      const trimmed = identifier.trim();
      if (!trimmed) {
        setError("Enter your email or username.");
        setLoadingPassword(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      let emailToUse = trimmed;

      // If it doesn't look like an email, treat it as a username and resolve to an email
      if (!emailToUse.includes("@")) {
        const { data, error: lookupError } = await supabase
          .from("users")
          .select("email")
          .eq("username", emailToUse)
          .maybeSingle();

        if (lookupError || !data?.email) {
          setError("No account found for that username or email.");
          setLoadingPassword(false);
          return;
        }
        emailToUse = data.email;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoadingPassword(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong logging you in.");
      setLoadingPassword(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setError(null);
      setLoadingGoogle(true);
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setError(error.message);
        setLoadingGoogle(false);
      }
      // On success, Supabase will redirect to Google then back to /auth/callback.
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong with Google login.");
      setLoadingGoogle(false);
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
            Log in to Would I Hire You?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or username</Label>
              <Input
                id="identifier"
                type="text"
                required
                placeholder="you@example.com or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loadingPassword || loadingGoogle}
            >
              {loadingPassword ? "Logging you in..." : "Log in"}
            </Button>
          </form>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loadingGoogle || loadingPassword}
            >
              {loadingGoogle ? "Redirecting to Google..." : "Continue with Google"}
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              You may see a <span className="font-medium">supabase.co</span> domain on the Google consent screen — that’s our
              secure sign-in provider. We never see your Google password.
            </p>
          </div>

          {error && (
            <p className="mt-3 text-center text-xs text-red-400">{error}</p>
          )}

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <span>Don&apos;t have an account? </span>
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

