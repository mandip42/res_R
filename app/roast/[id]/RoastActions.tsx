"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type RoastActionsProps = {
  roastId: string;
  plan?: "free" | "pro" | "lifetime";
  isJobCompare?: boolean;
};

export function RoastActions({ roastId, plan = "free", isJobCompare = false }: RoastActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [coldEmail, setColdEmail] = useState<{ subject: string; body: string } | null>(null);
  const [reuseOpen, setReuseOpen] = useState(false);
  const [reuseJobUrl, setReuseJobUrl] = useState("");
  const [reuseJobDescription, setReuseJobDescription] = useState("");
  const [reuseRolePreset, setReuseRolePreset] = useState<
    "default" | "big_tech" | "startup" | "consulting" | "finance"
  >("default");
  const [reuseLoading, setReuseLoading] = useState(false);
  const [reuseError, setReuseError] = useState<string | null>(null);

  const isPaid = plan === "pro" || plan === "lifetime";

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else alert(data?.error ?? "Could not open billing.");
    } catch {
      alert("Something went wrong.");
    } finally {
      setPortalLoading(false);
    }
  }

  function handleCopyLink() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/roast/${roastId}`
        : "";
    if (!url || typeof navigator === "undefined") return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleDownloadPdf() {
    try {
      const res = await fetch(`/api/roast/${roastId}/pdf`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? `Download failed (${res.status}). Try logging in again.`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `roast-${roastId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Download failed. Please try again.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/dashboard">Roast again</Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="min-w-[120px]"
        >
          {copied ? "Copied!" : "Copy share link"}
        </Button>
        <Button size="sm" onClick={handleDownloadPdf}>
          Download as PDF
        </Button>
        {isPaid && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManageSubscription}
            disabled={portalLoading}
          >
            {portalLoading ? "Opening…" : "Manage subscription"}
          </Button>
        )}
      </div>

      {/* Cover letter / outreach email (Pro, job-compare only) */}
      {isJobCompare && (
        <div className="space-y-2 rounded-lg border border-border/70 bg-card/80 p-3 text-xs text-muted-foreground md:text-sm">
          <p className="text-[11px] font-medium text-foreground">
            Turn this into a cover letter or outreach email
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="xs"
              variant={isPaid ? "outline" : "ghost"}
              className={!isPaid ? "text-primary" : ""}
              disabled={coverLoading}
              onClick={async () => {
                if (!isPaid) {
                  router.push("/pricing");
                  return;
                }
                setCoverLoading(true);
                setCoverError(null);
                try {
                  const res = await fetch(`/api/roast/${roastId}/cover-letter`, {
                    method: "POST",
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    if (res.status === 402) {
                      setCoverError(
                        "Cover letters and outreach emails are available on Pro and Lifetime plans."
                      );
                    } else {
                      setCoverError(data?.error ?? "Failed to generate cover letter.");
                    }
                    return;
                  }
                  setCoverLetter(data.cover_letter ?? null);
                  setColdEmail(data.cold_email ?? null);
                } catch (e: any) {
                  setCoverError(
                    e?.message ?? "Something went wrong while generating cover letter."
                  );
                } finally {
                  setCoverLoading(false);
                }
              }}
            >
              {isPaid ? (coverLoading ? "Generating…" : "Generate cover letter & email") : "Pro: cover letter & email"}
            </Button>
          </div>
          {!isPaid && (
            <p className="text-[11px] text-muted-foreground">
              Upgrade to Pro or Lifetime to get a tailored cover letter and outreach email for this job.
            </p>
          )}
          {coverError && (
            <p className="text-[11px] text-red-400">
              {coverError}
            </p>
          )}
          {(coverLetter || coldEmail) && (
            <div className="mt-2 space-y-3">
              {coverLetter && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-foreground">Cover letter</p>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      className="text-[10px]"
                      onClick={() => navigator.clipboard.writeText(coverLetter)}
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-border/60 bg-background/60 p-2 text-[11px] md:text-xs">
                    {coverLetter}
                  </pre>
                </div>
              )}
              {coldEmail && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-foreground">Outreach email</p>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      className="text-[10px]"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `Subject: ${coldEmail.subject}\n\n${coldEmail.body}`
                        )
                      }
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-border/60 bg-background/60 p-2 text-[11px] md:text-xs">
                    <strong>Subject:</strong> {coldEmail.subject}
                    {"\n\n"}
                    {coldEmail.body}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reuse this resume for another job (profile reuse, Pro only) */}
      <div className="space-y-2 rounded-lg border border-border/70 bg-card/80 p-3 text-xs text-muted-foreground md:text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-foreground">
            Use this resume for another job
          </p>
          <Button
            type="button"
            size="xs"
            variant={isPaid ? "outline" : "ghost"}
            className={!isPaid ? "text-primary" : ""}
            onClick={() => {
              if (!isPaid) {
                router.push("/pricing");
                return;
              }
              setReuseOpen((v) => !v);
            }}
          >
            {isPaid ? (reuseOpen ? "Hide" : "Pro: new job compare") : "Pro: new job compare"}
          </Button>
        </div>
        {reuseOpen && (
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-foreground/80">
                Job URL (optional)
              </label>
              <input
                type="url"
                className="h-8 w-full rounded-md border border-border/70 bg-background/60 px-2 text-[11px] outline-none ring-0 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="https://www.linkedin.com/jobs/view/..."
                value={reuseJobUrl}
                onChange={(e) => setReuseJobUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-foreground/80">
                Job description (paste the full posting)
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-border/70 bg-background/60 px-2 py-1 text-[11px] outline-none ring-0 focus:border-primary focus:ring-1 focus:ring-primary"
                value={reuseJobDescription}
                onChange={(e) => setReuseJobDescription(e.target.value)}
                placeholder="Paste the job description you want to compare this resume against."
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-foreground/80">
                Review lens
              </label>
              <select
                value={reuseRolePreset}
                onChange={(e) =>
                  setReuseRolePreset(e.target.value as typeof reuseRolePreset)
                }
                className="h-8 w-full max-w-xs rounded-full border border-border/70 bg-background/60 px-3 text-[11px] outline-none ring-0 focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="default">General hiring manager</option>
                <option value="big_tech">Big Tech / FAANG</option>
                <option value="startup">Startup hiring manager</option>
                <option value="consulting">Consulting interviewer</option>
                <option value="finance">Finance / banking recruiter</option>
              </select>
            </div>
            {reuseError && (
              <p className="text-[11px] text-red-400">
                {reuseError}
              </p>
            )}
            <Button
              type="button"
              size="sm"
              className="mt-1"
              disabled={reuseLoading}
              onClick={async () => {
                if (!reuseJobDescription || reuseJobDescription.trim().length < 80) {
                  setReuseError(
                    "Paste the full job description (at least a few sentences) to compare against."
                  );
                  return;
                }
                setReuseLoading(true);
                setReuseError(null);
                try {
                  const res = await fetch(`/api/roast/${roastId}/job-from-profile`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      job_description: reuseJobDescription.trim(),
                      job_url: reuseJobUrl.trim() || undefined,
                      role_preset: reuseRolePreset,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setReuseError(data?.error ?? "Failed to create new job comparison.");
                    return;
                  }
                  if (data?.id) {
                    router.push(`/roast/${data.id}`);
                  }
                } catch (e: any) {
                  setReuseError(
                    e?.message ?? "Something went wrong while creating the new roast."
                  );
                } finally {
                  setReuseLoading(false);
                }
              }}
            >
              {reuseLoading ? "Creating…" : "Compare this resume to new job"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
