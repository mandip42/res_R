"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthNav } from "@/components/auth-nav";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { AdminStats, AdminUserRow } from "@/app/api/admin/stats/route";

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  lifetime: "Lifetime",
};

function UserTable({ users, plan }: { users: AdminUserRow[]; plan: "free" | "pro" | "lifetime" }) {
  if (users.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-4">No {plan} users yet.</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs md:text-sm">
        <thead>
          <tr className="border-b border-border/70">
            <th className="pb-2 pr-3 font-medium text-foreground">Email</th>
            <th className="pb-2 pr-3 font-medium text-foreground hidden sm:table-cell">Name</th>
            <th className="pb-2 pr-3 font-medium text-foreground hidden md:table-cell">Username</th>
            <th className="pb-2 pr-3 font-medium text-foreground">Joined</th>
            <th className="pb-2 pr-3 font-medium text-foreground text-right">Roasts</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2 pr-3">
                <span className="text-foreground">{u.email}</span>
              </td>
              <td className="py-2 pr-3 hidden sm:table-cell">{u.full_name ?? "—"}</td>
              <td className="py-2 pr-3 hidden md:table-cell">{u.username ?? "—"}</td>
              <td className="py-2 pr-3 whitespace-nowrap">
                {new Date(u.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              <td className="py-2 text-right font-medium text-foreground">{u.roast_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SignupsChart({ signupsByDay }: { signupsByDay: { date: string; count: number }[] }) {
  const max = Math.max(1, ...signupsByDay.map((d) => d.count));
  return (
    <div className="flex items-end gap-0.5 h-24">
      {signupsByDay.map((d) => (
        <div
          key={d.date}
          className="flex-1 min-w-0 flex flex-col items-center gap-0.5"
          title={`${d.date}: ${d.count} signups`}
        >
          <div
            className="w-full max-w-[8px] rounded-t bg-primary/70 hover:bg-primary transition-colors"
            style={{ height: `${(d.count / max) * 80}%`, minHeight: d.count > 0 ? 4 : 0 }}
          />
          <span className="text-[10px] text-muted-foreground truncate max-w-full">
            {new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      ))}
    </div>
  );
}

function VisitsChart({
  visitsByDay,
}: {
  visitsByDay: { date: string; count: number; uniques: number }[];
}) {
  const max = Math.max(1, ...visitsByDay.map((d) => d.count));
  return (
    <div className="flex items-end gap-0.5 h-24">
      {visitsByDay.map((d) => (
        <div
          key={d.date}
          className="flex-1 min-w-0 flex flex-col items-center gap-0.5"
          title={`${d.date}: ${d.count} visits, ${d.uniques} unique`}
        >
          <div
            className="w-full max-w-[8px] rounded-t bg-emerald-600/70 hover:bg-emerald-600 transition-colors"
            style={{ height: `${(d.count / max) * 80}%`, minHeight: d.count > 0 ? 4 : 0 }}
          />
          <span className="text-[10px] text-muted-foreground truncate max-w-full">
            {new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"free" | "pro" | "lifetime">("free");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 403) {
          setError("Access denied. Admin only.");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError("Failed to load admin stats.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setStats(data);
      } catch (e) {
        setError("Failed to load admin stats.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-6xl flex flex-col items-center justify-center gap-4">
          <Logo height={36} width={180} />
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading admin dashboard…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-6xl flex flex-col gap-4">
          <nav className="flex items-center justify-between gap-4">
            <Logo height={36} width={180} />
            <AuthNav />
          </nav>
          <Card className="border-destructive/40">
            <CardContent className="py-8 text-center">
              <p className="text-destructive font-medium">{error}</p>
              <Link href="/dashboard" className="text-sm text-primary hover:underline mt-2 inline-block">
                ← Back to dashboard
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!stats) return null;

  const {
    users,
    totals,
    conversionRate,
    totalRoasts,
    avgRoastsPerUser,
    signupsByDay,
    totalVisits,
    uniqueVisitors,
    visitsByDay,
    signupConversionRate,
  } = stats;
  const freeUsers = users.filter((u) => u.plan === "free");
  const proUsers = users.filter((u) => u.plan === "pro");
  const lifetimeUsers = users.filter((u) => u.plan === "lifetime");

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-6xl flex flex-col gap-8">
        <nav className="flex items-center justify-between gap-4">
          <Logo height={36} width={180} />
          <AuthNav />
        </nav>

        <header>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visitors, users, plans, and conversion metrics. Data from <code className="text-xs bg-muted px-1 rounded">public.visits</code>, <code className="text-xs bg-muted px-1 rounded">public.users</code>, and roasts.
          </p>
        </header>

        {/* Visitor metrics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total visits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{totalVisits.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Page views recorded</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Unique visitors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{uniqueVisitors.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">By cookie (last 30d+)</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Signup conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{signupConversionRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Visitors who signed up</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{totals.total}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Registered accounts</p>
            </CardContent>
          </Card>
        </section>

        {/* Visits over time */}
        <section>
          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Visits (last 30 days)</CardTitle>
              <p className="text-xs text-muted-foreground">Page views per day (hover for unique visitors)</p>
            </CardHeader>
            <CardContent>
              <VisitsChart visitsByDay={visitsByDay} />
            </CardContent>
          </Card>
        </section>

        {/* User metrics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Free / Pro / Lifetime</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">
                {totals.free} / {totals.pro} / {totals.lifetime}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Conversion rate (paid)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{conversionRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Pro + Lifetime of users</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total roasts / avg per user</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{totalRoasts}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{avgRoastsPerUser} per user</p>
            </CardContent>
          </Card>
        </section>

        {/* Signups over time */}
        <section>
          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Signups (last 30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <SignupsChart signupsByDay={signupsByDay} />
            </CardContent>
          </Card>
        </section>

        {/* Users by plan */}
        <section>
          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Users by plan</CardTitle>
              <div className="flex gap-2 mt-2">
                {(["free", "pro", "lifetime"] as const).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setActiveTab(plan)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      activeTab === plan
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {PLAN_LABEL[plan]} ({plan === "free" ? freeUsers.length : plan === "pro" ? proUsers.length : lifetimeUsers.length})
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === "free" && <UserTable users={freeUsers} plan="free" />}
              {activeTab === "pro" && <UserTable users={proUsers} plan="pro" />}
              {activeTab === "lifetime" && <UserTable users={lifetimeUsers} plan="lifetime" />}
            </CardContent>
          </Card>
        </section>

        <p className="text-xs text-muted-foreground">
          <Link href="/dashboard" className="text-primary hover:underline">← Back to dashboard</Link>
        </p>
      </div>
    </main>
  );
}
