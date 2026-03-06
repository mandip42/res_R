import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type Plan = "free" | "pro" | "lifetime";

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  plan: Plan;
  created_at: string;
  roast_count: number;
};

export type AdminStats = {
  users: AdminUserRow[];
  totals: { total: number; free: number; pro: number; lifetime: number };
  conversionRate: number; // % paid (pro + lifetime)
  totalRoasts: number;
  avgRoastsPerUser: number;
  signupsByDay: { date: string; count: number }[];
  totalVisits: number;
  uniqueVisitors: number;
  visitsByDay: { date: string; count: number; uniques: number }[];
  signupConversionRate: number; // registered / unique visitors %
};

/** GET: admin-only. Returns all users with roast counts and aggregate metrics. */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "Server misconfigured for admin stats" },
      { status: 500 },
    );
  }

  const adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: users, error: usersError } = await adminClient
    .from("users")
    .select("id, email, full_name, username, plan, created_at")
    .order("created_at", { ascending: false });

  if (usersError) {
    console.error("Admin stats users error", usersError);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 },
    );
  }

  const { data: roastCounts, error: roastsError } = await adminClient
    .from("roasts")
    .select("user_id");

  if (roastsError) {
    console.error("Admin stats roasts error", roastsError);
  }

  const countByUser: Record<string, number> = {};
  if (Array.isArray(roastCounts)) {
    for (const r of roastCounts) {
      const uid = (r as { user_id: string }).user_id;
      countByUser[uid] = (countByUser[uid] ?? 0) + 1;
    }
  }

  const totalRoasts = Object.values(countByUser).reduce((a, b) => a + b, 0);
  const rows = (users ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name ?? null,
    username: u.username ?? null,
    plan: u.plan as Plan,
    created_at: u.created_at,
    roast_count: countByUser[u.id] ?? 0,
  }));

  const free = rows.filter((r) => r.plan === "free").length;
  const pro = rows.filter((r) => r.plan === "pro").length;
  const lifetime = rows.filter((r) => r.plan === "lifetime").length;
  const total = rows.length;
  const paid = pro + lifetime;
  const conversionRate = total > 0 ? Math.round((paid / total) * 1000) / 10 : 0;
  const avgRoastsPerUser = total > 0 ? Math.round((totalRoasts / total) * 10) / 10 : 0;

  const now = new Date();
  const last30: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toISOString().slice(0, 10);
    const dayEnd = new Date(d);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const count = rows.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= d.getTime() && t < dayEnd.getTime();
    }).length;
    last30.push({ date: dateStr, count });
  }

  // Visits: total, unique visitors, by day (last 30)
  let totalVisits = 0;
  let uniqueVisitors = 0;
  const visitsByDay: { date: string; count: number; uniques: number }[] = [];

  // Build 30-day skeleton so chart always has data
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    visitsByDay.push({ date: d.toISOString().slice(0, 10), count: 0, uniques: 0 });
  }

  try {
    const { data: visits, error: visitsError } = await adminClient
      .from("visits")
      .select("id, created_at, visitor_id");

    if (!visitsError && Array.isArray(visits)) {
      totalVisits = visits.length;
      const uniques = new Set<string>();
      visits.forEach((v) => {
        const vid = (v as { visitor_id?: string }).visitor_id;
        if (vid) uniques.add(vid);
      });
      uniqueVisitors = uniques.size;

      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const dateStr = d.toISOString().slice(0, 10);
        const dayEnd = new Date(d);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const dayVisits = visits.filter((v) => {
          const t = new Date((v as { created_at: string }).created_at).getTime();
          return t >= d.getTime() && t < dayEnd.getTime();
        });
        const dayUniques = new Set(dayVisits.map((v) => (v as { visitor_id: string }).visitor_id));
        visitsByDay[29 - i] = { date: dateStr, count: dayVisits.length, uniques: dayUniques.size };
      }
    }
  } catch (e) {
    console.error("Admin stats visits error", e);
  }

  const signupConversionRate =
    uniqueVisitors > 0 ? Math.round((total / uniqueVisitors) * 1000) / 10 : 0;

  const stats: AdminStats = {
    users: rows,
    totals: { total, free, pro, lifetime },
    conversionRate,
    totalRoasts,
    avgRoastsPerUser,
    signupsByDay: last30,
    totalVisits,
    uniqueVisitors,
    visitsByDay,
    signupConversionRate,
  };

  return NextResponse.json(stats);
}
