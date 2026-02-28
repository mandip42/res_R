"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthUser = {
  email?: string;
  full_name?: string;
  username?: string;
};

export function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  async function fetchUser() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setUser(null);
        return;
      }
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser({
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name,
            username: session.user.user_metadata?.username,
          });
        }
      } catch {
        setUser({
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
          username: session.user.user_metadata?.username,
        });
      }
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    fetchUser();
    let unsubscribe: (() => void) | undefined;
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        fetchUser();
      });
      unsubscribe = () => subscription.unsubscribe();
    } catch {
      /* no Supabase env */
    }
    return () => unsubscribe?.();
  }, []);

  async function handleSignOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const displayName =
    user?.username ?? user?.full_name ?? user?.email?.split("@")[0] ?? "Account";

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm"
        >
          Home
        </Link>
        <Link
          href="/pricing"
          className="text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm"
        >
          Pricing
        </Link>
        <Link
          href="/login"
          className="text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm"
        >
          Log in
        </Link>
        <Button asChild size="sm">
          <Link href="/signup" className="flex items-center gap-1">
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/"
        className="text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm"
      >
        Home
      </Link>
      <Link
        href="/pricing"
        className="text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm"
      >
        Pricing
      </Link>
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm"
      >
        <User className="h-3.5 w-3.5" />
        {displayName}
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm"
      >
        <LogOut className="h-3.5 w-3.5" />
        Log out
      </button>
    </div>
  );
}
