"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AuthNav } from "@/components/auth-nav";
import { Logo } from "@/components/logo";

const ROAST_STEPS = [
  "Uploading your resume…",
  "Reading your experience…",
  "AI is roasting your resume…",
  "Preparing your feedback…",
  "Almost there…",
];

type PastRoast = {
  id: string;
  created_at: string;
  score: number | null;
  status: string;
  one_liner: string | null;
};

function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else alert(data?.error ?? "Could not open billing.");
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={openPortal} disabled={loading}>
      {loading ? "Opening…" : "Manage subscription"}
    </Button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastRoasts, setPastRoasts] = useState<PastRoast[]>([]);
  const [roastsLoading, setRoastsLoading] = useState(true);
  const [plan, setPlan] = useState<"free" | "pro" | "lifetime">("free");
  const [roastStepIndex, setRoastStepIndex] = useState(0);
  const [roastProgress, setRoastProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPaid = plan === "pro" || plan === "lifetime";
  const [mode, setMode] = useState<"resume" | "job">("resume");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [rolePreset, setRolePreset] = useState<
    "default" | "big_tech" | "startup" | "consulting" | "finance"
  >("default");

  useEffect(() => {
    if (!uploading) {
      setRoastProgress(0);
      setRoastStepIndex(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
      return;
    }
    setRoastProgress(0);
    setRoastStepIndex(0);
    stepIntervalRef.current = setInterval(() => {
      setRoastStepIndex((i) => (i + 1) % ROAST_STEPS.length);
    }, 2800);
    progressIntervalRef.current = setInterval(() => {
      setRoastProgress((p) => {
        if (p >= 90) return 90;
        return p + Math.random() * 6 + 4;
      });
    }, 400);
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, [uploading]);

  useEffect(() => {
    async function loadRoasts() {
      try {
        const res = await fetch("/api/roasts");
        if (res.ok) {
          const data = await res.json();
          setPastRoasts(data.roasts ?? []);
          if (data.plan) setPlan(data.plan);
        }
      } catch {
        setPastRoasts([]);
      } finally {
        setRoastsLoading(false);
      }
    }
    loadRoasts();
  }, []);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      if (!file) {
        setError("Please choose a resume file first.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("role_preset", rolePreset);

      if (mode === "job") {
        if (!jobDescription || jobDescription.trim().length < 80) {
          setError("Paste the full job description (at least a few sentences) to compare against.");
          setUploading(false);
          return;
        }
        formData.append("job_description", jobDescription.trim());
        if (jobUrl.trim()) {
          formData.append("job_url", jobUrl.trim());
        }
      }

      const endpoint = mode === "job" ? "/api/roast/job" : "/api/roast";

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError("You need to be logged in to roast a resume.");
          return router.push("/login");
        }
        if (res.status === 402) {
          setError("Free plan limit reached. Upgrade to keep roasting.");
          return router.push("/pricing");
        }

        setError(data?.error ?? "Failed to roast your resume. Please try again.");
        return;
      }

      if (data?.id) {
        setRoastProgress(100);
        setPastRoasts((prev) => [
          {
            id: data.id,
            created_at: new Date().toISOString(),
            score: null,
            status: "completed",
            one_liner: null,
          },
          ...prev,
        ]);
        setTimeout(() => router.push(`/roast/${data.id}`), 400);
      }
    } catch (err: any) {
      setError(
        err?.message ??
          "Something went wrong while sending your resume. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <nav className="flex items-center justify-between gap-4">
          <Logo height={36} width={180} />
          <AuthNav />
        </nav>
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Upload your resume, get roasted, and track your glow-up over time.
            </p>
          </div>
          {isPaid ? null : (
            <Button asChild variant="outline" size="sm">
              <Link href="/pricing">Upgrade plan</Link>
            </Button>
          )}
        </header>

        <section className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Upload resume</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="inline-flex rounded-full border border-border/70 bg-background/60 p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setMode("resume")}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      mode === "resume"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Roast my resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("job")}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      mode === "job"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Compare to a job
                  </button>
                </div>
                <div className="space-y-1 text-[11px] text-muted-foreground">
                  <label className="block font-medium text-foreground/80">
                    Review lens
                  </label>
                  <select
                    value={rolePreset}
                    onChange={(e) =>
                      setRolePreset(e.target.value as typeof rolePreset)
                    }
                    className="mt-0.5 h-8 w-full max-w-xs rounded-full border border-border/70 bg-card px-3 text-[11px] text-foreground outline-none ring-0 focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="default">General hiring manager</option>
                    <option value="big_tech">Big Tech / FAANG</option>
                    <option value="startup">Startup hiring manager</option>
                    <option value="consulting">Consulting interviewer</option>
                    <option value="finance">Finance / banking recruiter</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex flex-1 cursor-pointer items-center justify-between rounded-full border border-dashed border-border/70 bg-background/60 px-4 py-2 text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground">
                    <span>
                      {fileName
                        ? fileName
                        : "Choose a PDF or DOCX (max 5MB) to get roasted"}
                    </span>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] text-primary">
                      Browse
                    </span>
                    <Input
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const selected = e.target.files?.[0] ?? null;
                        setFile(selected);
                        setFileName(selected?.name ?? null);
                      }}
                    />
                  </label>
                </div>
                {mode === "job" && (
                  <div className="space-y-3 text-xs text-muted-foreground md:text-sm">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-foreground/80">
                        Job URL (LinkedIn, Indeed, or company careers page)
                      </label>
                      <Input
                        type="url"
                        placeholder="https://www.linkedin.com/jobs/view/..."
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-foreground/80">
                        Job description (paste the full posting)
                      </label>
                      <textarea
                        className="min-h-[120px] w-full rounded-md border border-border/70 bg-background/60 px-3 py-2 text-xs outline-none ring-0 focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Paste the job description from LinkedIn, Indeed, or a company careers page so we can see how well your resume fits it."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={uploading || !fileName}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner className="h-4 w-4" />
                      <span>Roasting in progress…</span>
                    </span>
                  ) : (
                    "Roast this resume"
                  )}
                </Button>
                {uploading && (
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground transition-opacity">
                      {ROAST_STEPS[roastStepIndex]}
                    </p>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(roastProgress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.min(Math.round(roastProgress), 100)}%
                    </p>
                  </div>
                )}
              </form>
              {error && (
                <p className="mt-3 text-xs text-red-400">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Plan & billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground md:text-sm">
              <p>
                <span className="font-medium text-foreground">Current plan:</span>{" "}
                {plan === "lifetime" ? "Lifetime" : plan === "pro" ? "Pro" : "Free"}
              </p>
              {isPaid ? (
                <>
                <p>
                  You have unlimited roasts and PDF downloads. You’re all set.
                </p>
                  <ManageBillingButton />
                </>
              ) : (
                <>
                  <p>
                    Free users get <span className="font-semibold">1</span> full roast.
                    Upgrade to unlock unlimited roasts and PDF downloads.
                  </p>
                  {!roastsLoading && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">{Math.min(pastRoasts.length, 1)} of 1</span> free roast used
                    </p>
                  )}
                  <Button asChild size="sm" className="mt-2 w-full">
                    <Link href="/pricing">See upgrade options</Link>
                  </Button>
                </>
              )}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-3 space-y-1 rounded-md border border-dashed border-border/60 bg-background/60 p-2 text-[11px]">
                  <p className="font-medium text-foreground/80">
                    Dev: switch plan for testing
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["free", "pro", "lifetime"] as const).map((p) => (
                      <Button
                        key={p}
                        type="button"
                        size="sm"
                        variant={plan === p ? "outline" : "ghost"}
                        className="text-[11px] px-2 py-0 h-7"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/dev/plan", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ plan: p }),
                            });
                            const data = await res.json();
                            if (!res.ok) {
                              alert(data?.error ?? "Failed to set plan");
                              return;
                            }
                            setPlan(p);
                          } catch {
                            alert("Failed to set plan");
                          }
                        }}
                      >
                        {p === "free" ? "Free" : p === "pro" ? "Pro" : "Lifetime"}
                      </Button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Only works when you&apos;re logged in as an admin email (dev/testing).
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Past roasts</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground md:text-sm">
              {roastsLoading ? (
                <div className="flex items-center justify-center gap-2 py-6">
                  <Spinner className="h-4 w-4" />
                  <span>Loading your roasts...</span>
                </div>
              ) : pastRoasts.length === 0 ? (
                <p>
                  No roasts yet. Upload a resume above to get your first roast.
                </p>
              ) : (
                <ul className="space-y-3">
                  {pastRoasts.map((roast) => (
                    <li key={roast.id}>
                      <Link
                        href={`/roast/${roast.id}`}
                        className="block rounded-lg border border-border/70 bg-background/60 px-3 py-2 transition-colors hover:border-primary/50 hover:bg-muted/50"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-foreground">
                            {roast.score != null ? `Score: ${roast.score}/100` : "Roast"}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(roast.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {roast.one_liner && (
                          <p className="mt-1 line-clamp-2 text-muted-foreground">
                            {roast.one_liner}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

