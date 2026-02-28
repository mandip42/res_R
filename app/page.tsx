"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { AuthNav } from "@/components/auth-nav";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const testimonials = [
  {
    name: "Aisha, Product Manager",
    text:
      "This thing hurt my feelings and then doubled my interview rate. 10/10 would get roasted again."
  },
  {
    name: "Marcus, SWE",
    text:
      "Called my resume 'LinkedIn-template cosplay' and then told me exactly how to fix it."
  },
  {
    name: "Priya, Data Scientist",
    text:
      "The AI caught fluff my human reviewers missed. The 'fix' suggestions were stupidly actionable."
  },
  {
    name: "Diego, New Grad",
    text:
      "Brutal, hilarious, and somehow motivating. Turned my campus-club resume into something FAANG-ready."
  },
  {
    name: "Lena, Designer",
    text:
      "It roasted my buzzwords so hard I rewrote my entire portfolio. Landed 3 onsites."
  },
  {
    name: "Noah, Consultant",
    text:
      "Feels like getting dragged by a McKinsey EM who secretly wants you to win."
  }
];

const faqs = [
  {
    q: "What file types do you support?",
    a: "Upload your resume as PDF or DOCX, up to 5MB. We'll handle the parsing and clean-up."
  },
  {
    q: "Is my resume data safe?",
    a: "Yes. Your resume and roast live in your account and are never sold or used to train models."
  },
  {
    q: "What does the free plan include?",
    a: "You get one full roast with a score, section-by-section critique, top fixes, and red-flag callouts. No PDF download on the free plan — after that roast, you'll need Pro or Lifetime for more."
  },
  {
    q: "How fast is a roast?",
    a: "Usually under 60 seconds. The longest part is you emotionally preparing for the feedback."
  },
  {
    q: "How does the roast work?",
    a: "We analyze your resume with a system built specifically for hiring feedback — you get a structured score, section-by-section critique, red flags, and concrete fixes, not generic tips."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yep. Manage your subscription in the billing portal and cancel with a couple of clicks."
  }
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* animated background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(255,49,49,0.35)_0,_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 right-[-10rem] h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(248,113,113,0.2)_0,_transparent_60%)] blur-3xl" />
        <motion.div
          className="absolute inset-0 opacity-40"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
          style={{
            backgroundImage:
              "radial-gradient(circle at 0 0, rgba(255,49,49,0.12), transparent 55%), radial-gradient(circle at 100% 100%, rgba(248,113,113,0.08), transparent 55%)",
            backgroundSize: "200% 200%"
          }}
        />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 pb-16 pt-10 md:pt-16">
        {/* nav */}
        <header className="flex items-center justify-between gap-4">
          <Logo height={40} width={200} />
          <AuthNav />
        </header>

        {/* hero */}
        <section className="grid gap-10 md:grid-cols-[1.2fr,1fr] md:items-center">
          <div className="space-y-6">
            <Badge className="border border-primary/30 bg-primary/10 text-xs text-primary">
              Joined by 2,400+ job seekers
            </Badge>

            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-balance text-3xl font-semibold tracking-tight md:text-5xl"
              >
                Your resume is probably terrible.
                <span className="block text-primary">Let&apos;s fix that.</span>
              </motion.h1>
              <p className="max-w-xl text-sm text-muted-foreground md:text-base">
                Get a brutally honest, AI-powered roast of your resume — with sharp,
                no-BS critique and concrete fixes — in under 60 seconds.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="px-7 text-sm md:text-base" aria-label="Go to dashboard to roast your resume">
                <Link href="/dashboard" className="flex items-center gap-2">
                  Roast My Resume
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground md:text-sm">
                No fluff. No sugarcoating. Just the feedback you actually need.
                <span className="block mt-1 text-muted-foreground/80">Free to try — no credit card required.</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-muted-foreground md:text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Results in under 60 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Actionable fixes — not generic advice</span>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            <Card className="border border-primary/20 bg-card/70">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Sample Roast</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    Example score: 62 / 100
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-muted-foreground md:text-sm">
                <div>
                  <p className="font-medium text-foreground">One-liner</p>
                  <p>
                    This resume reads like a LinkedIn template someone filled out on
                    the train — competent but utterly forgettable.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Top fix</p>
                  <p>
                    Rewrite every bullet into impact-first statements with hard
                    numbers: shipped X, saved Y hours, increased Z%.
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-[11px] text-muted-foreground">
                  We&apos;ll also call out <strong className="text-foreground">red flags</strong> — fluff,
                  vague verbs, weak summaries, and &quot;team player&quot; energy — then tell you exactly what to write instead.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* how it works */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold tracking-tight md:text-xl">
            How it works
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">1. Upload</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground md:text-sm">
                Drop in your PDF or DOCX. We parse the text, strip the formatting, and
                prep it for a proper roast.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">2. Get roasted</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground md:text-sm">
                Expert-level feedback on your summary, skills, and experience —
                ruthless but fair, so you know exactly what to fix.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">3. Fix &amp; get hired</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground md:text-sm">
                Follow the concrete fixes, download a polished PDF (Pro), and send out
                a resume that actually earns interviews.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* pricing summary */}
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight md:text-xl">
              Pricing that doesn&apos;t hate your wallet
            </h2>
            <Link
              href="/pricing"
              className="text-xs font-medium text-primary hover:text-primary/80 md:text-sm"
            >
              View full pricing →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Free</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground md:text-sm">
                <p className="text-base font-semibold text-foreground">$0</p>
                <p>1 resume roast. Basic breakdown. No downloads.</p>
              </CardContent>
            </Card>
            <Card className="border-primary/40 shadow-glow-red">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Pro</CardTitle>
                <Badge className="bg-primary/20 text-[10px] uppercase tracking-wide text-primary">
                  Most popular
                </Badge>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground md:text-sm">
                <p className="text-base font-semibold text-foreground">
                  $9 / month or $79 / year
                </p>
                <p>Unlimited roasts, full breakdowns, PDF downloads, priority queue.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Lifetime</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground md:text-sm">
                <p className="text-base font-semibold text-foreground">$149 once</p>
                <p>Everything in Pro, forever. Early adopter badge. Future features.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* testimonials */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold tracking-tight md:text-xl">
            People who survived the roast
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/70 bg-card/60">
                <CardContent className="space-y-3 pt-5 text-xs text-muted-foreground md:text-sm">
                  <p>&quot;{t.text}&quot;</p>
                  <p className="text-[11px] font-medium text-foreground/80">
                    — {t.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold tracking-tight md:text-xl">
            FAQ
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((f) => (
              <Card key={f.q} className="border-border/70 bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{f.q}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground md:text-sm">
                  {f.a}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* footer */}
        <footer className="flex flex-col gap-3 border-t border-border/60 pt-6 text-[11px] text-muted-foreground md:flex-row md:items-center md:justify-between md:text-xs">
          <p>© {new Date().getFullYear()} Roast My Resume. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Login
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

