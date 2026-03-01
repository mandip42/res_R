"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthNav } from "@/components/auth-nav";
import { Logo } from "@/components/logo";
import { CheckoutButton } from "@/components/checkout-button";

type Plan = "free" | "pro" | "lifetime" | null;

export default function PricingPage() {
  const [plan, setPlan] = useState<Plan>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setPlan(data?.user?.plan ?? null))
      .catch(() => setPlan(null));
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <nav className="flex items-center justify-between gap-4">
          <Logo height={36} width={180} />
          <AuthNav />
        </nav>
        <header className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Pricing that won&apos;t roast your bank account
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            Start free, then upgrade if you want unlimited roasts, detailed breakdowns,
            and downloadable PDFs.
          </p>
        </header>

        <section className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span>Save 27% with yearly Pro</span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {/* Free */}
          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle className="text-sm">Free</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="text-2xl font-semibold text-foreground">$0</p>
              <ul className="space-y-1 text-xs md:text-sm">
                <li>• 1 resume roast</li>
                <li>• Basic feedback only</li>
                <li>• No downloads</li>
              </ul>
              {plan === "free" ? (
                <Button disabled className="mt-3 w-full" variant="outline">
                  Current plan
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="border-primary/50 bg-card/80 shadow-glow-red">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Pro</CardTitle>
              <Badge className="bg-primary/20 text-[10px] uppercase tracking-wide text-primary">
                Most popular
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="text-2xl font-semibold text-foreground">$9</p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
              <ul className="space-y-1 text-xs md:text-sm">
                <li>• Unlimited resume roasts</li>
                <li>• Full detailed breakdown</li>
                <li>• PDF download</li>
                <li>• Priority processing</li>
              </ul>
              {plan === "pro" ? (
                <Button disabled className="mt-3 w-full" variant="outline">
                  Current plan
                </Button>
              ) : (
                <>
                  <CheckoutButton plan="pro" className="mt-3 w-full">
                    Upgrade to Pro ($9/mo)
                  </CheckoutButton>
                  <CheckoutButton plan="pro_year" variant="outline" className="mt-2 w-full">
                    Or $79/year (save 27%)
                  </CheckoutButton>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lifetime */}
          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle className="text-sm">Lifetime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="text-2xl font-semibold text-foreground">$149</p>
              <p className="text-xs text-muted-foreground">one-time payment</p>
              <ul className="space-y-1 text-xs md:text-sm">
                <li>• Everything in Pro, forever</li>
                <li>• Early adopter badge on profile</li>
                <li>• All future features included</li>
              </ul>
              {plan === "lifetime" ? (
                <Button disabled className="mt-3 w-full" variant="outline">
                  Current plan
                </Button>
              ) : (
                <CheckoutButton plan="lifetime" variant="outline" className="mt-3 w-full">
                  Get Lifetime
                </CheckoutButton>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

