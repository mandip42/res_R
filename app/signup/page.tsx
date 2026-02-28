"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Logo } from "@/components/logo";

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{2,30}$/;

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const nameTrim = fullName.trim();
    const userTrim = username.trim().toLowerCase();

    if (!nameTrim) {
      setError("Please enter your name.");
      setLoading(false);
      return;
    }
    if (!USERNAME_REGEX.test(userTrim)) {
      setError("Username must be 2–30 characters (letters, numbers, _ or -).");
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { full_name: nameTrim, username: userTrim },
        },
      });

      if (signUpError) {
        const msg = signUpError.message;
        const isRateLimit = /rate limit|429/i.test(msg);
        setError(
          isRateLimit
            ? "Too many sign-up attempts. Supabase allows ~2 auth emails per hour. Try logging in if you already have an account, or wait an hour and try again."
            : msg
        );
        setLoading(false);
        return;
      }

      if (data?.session) {
        const syncRes = await fetch("/api/auth/sync-profile", { method: "POST" });
        const syncData = await syncRes.json();
        if (!syncRes.ok) {
          setError(syncData?.error ?? "Account created but profile sync failed. Try logging in.");
          setLoading(false);
          return;
        }
        setMessage("Account created! Redirecting…");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setMessage(
        "Check your email and click the confirmation link. Then you can log in."
      );
      setLoading(false);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong creating your account.");
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
            Create your account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                type="text"
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                required
                placeholder="janedoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                2–30 characters, letters, numbers, _ or -
              </p>
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          {error && (
            <p className="mt-3 text-center text-xs text-red-400">{error}</p>
          )}
          {message && !error && (
            <p className="mt-3 text-center text-xs text-emerald-400">{message}</p>
          )}

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <span>Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

