"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthNav } from "@/components/auth-nav";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProfileUser = {
  email: string | null;
  username: string | null;
  full_name: string | null;
  plan: "free" | "pro" | "lifetime";
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          setError("Failed to load profile.");
          return;
        }
        const data = await res.json();
        if (!data?.user) {
          router.push("/login");
          return;
        }
        setUser(data.user as ProfileUser);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleOpenPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert(data?.error ?? "Could not open billing.");
      }
    } catch {
      alert("Something went wrong opening billing.");
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (
      !window.confirm(
        "This will permanently delete your account, billing profile, and all roasts. This cannot be undone. Continue?",
      )
    ) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data?.error ?? "Failed to delete account. Please try again.");
        setDeleting(false);
        return;
      }
      window.location.href = "/";
    } catch (e: any) {
      setDeleteError(
        e?.message ?? "Something went wrong while deleting your account. Please try again.",
      );
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <nav className="flex items-center justify-between gap-4">
          <Logo height={36} width={180} />
          <AuthNav />
        </nav>

        <header className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">My profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account details, plan, and account deletion.
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : user ? (
          <div className="space-y-6">
            <section>
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-sm md:text-base">Account details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground md:text-sm">
                  <p>
                    <span className="font-medium text-foreground">Email:</span>{" "}
                    {user.email ?? "—"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Name:</span>{" "}
                    {user.full_name ?? "—"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Username:</span>{" "}
                    {user.username ?? "—"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Plan:</span>{" "}
                    {user.plan === "lifetime"
                      ? "Lifetime"
                      : user.plan === "pro"
                      ? "Pro"
                      : "Free"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    To change your password, use{" "}
                    <Link href="/forgot-password" className="text-primary hover:underline">
                      Forgot password
                    </Link>{" "}
                    and follow the link in your email.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-sm md:text-base">Billing & subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground md:text-sm">
                  <p>
                    Manage your subscription, invoices, and payment methods in the Stripe billing
                    portal.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleOpenPortal}
                    disabled={portalLoading}
                  >
                    {portalLoading ? "Opening billing portal…" : "Open billing portal"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Cancelling in the billing portal stops future renewals. Your current access may
                    remain active until the end of the billing period.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card className="border-destructive/40 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-sm md:text-base text-destructive">
                    Delete account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground md:text-sm">
                  <p>
                    This will permanently delete your account, your profile, and all roasts. This
                    action cannot be undone.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    size="sm"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting account…" : "Delete my account"}
                  </Button>
                  {deleteError && (
                    <p className="text-xs text-red-400">
                      {deleteError}
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

