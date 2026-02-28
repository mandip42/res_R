"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AuthNav } from "@/components/auth-nav";
import { Logo } from "@/components/logo";

type PastRoast = {
  id: string;
  created_at: string;
  score: number | null;
  status: string;
  one_liner: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastRoasts, setPastRoasts] = useState<PastRoast[]>([]);
  const [roastsLoading, setRoastsLoading] = useState(true);
  const [plan, setPlan] = useState<"free" | "pro" | "lifetime">("free");

  const isPaid = plan === "pro" || plan === "lifetime";

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

      const res = await fetch("/api/roast", {
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
        router.push(`/roast/${data.id}`);
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={uploading || !fileName}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner className="h-4 w-4" />
                      <span>Cringing at your resume... please wait</span>
                    </span>
                  ) : (
                    "Roast this resume"
                  )}
                </Button>
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
                <p>
                  You have unlimited roasts and PDF downloads. You’re all set.
                </p>
              ) : (
                <>
                  <p>
                    Free users get <span className="font-semibold">1</span> full roast.
                    Upgrade to unlock unlimited roasts and PDF downloads.
                  </p>
                  <Button asChild size="sm" className="mt-2 w-full">
                    <Link href="/pricing">See upgrade options</Link>
                  </Button>
                </>
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

