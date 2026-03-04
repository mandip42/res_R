"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type SectionKey = "first_impression" | "skills_section" | "work_experience";

type SectionCardClientProps = {
  roastId: string;
  plan: "free" | "pro" | "lifetime";
  title: string;
  roast: string;
  fix: string;
  sectionKey: SectionKey;
  isJobCompare: boolean;
};

export function SectionCardClient({
  roastId,
  plan,
  title,
  roast,
  fix,
  sectionKey,
  isJobCompare,
}: SectionCardClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<string[] | null>(null);

  const isPaid = plan === "pro" || plan === "lifetime";

  async function handleRewrite() {
    if (!isPaid) {
      router.push("/pricing");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/roast/${roastId}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: sectionKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setError("Section rewrites are available on Pro and Lifetime plans.");
        } else {
          setError(data?.error ?? "Failed to generate rewrites.");
        }
        return;
      }
      setAlternatives(data.alternatives ?? []);
    } catch (e: any) {
      setError(
        e?.message ?? "Something went wrong while generating rewrites. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // best-effort; no-op on failure
    }
  }

  const rewriteLabel = isJobCompare ? "Rewrite for this job" : "Rewrite this section";

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm md:text-base">{title}</CardTitle>
        <Button
          type="button"
          size="sm"
          variant={isPaid ? "outline" : "ghost"}
          className={`text-[11px] px-2 py-0 h-7 ${!isPaid ? "text-primary" : ""}`}
          onClick={handleRewrite}
          disabled={loading}
        >
          {isPaid
            ? loading
              ? "Rewriting…"
              : rewriteLabel
            : "Pro: " + rewriteLabel}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground md:text-sm">
        <div>
          <p className="font-medium text-red-300">Roast</p>
          <p>{roast}</p>
        </div>
        <div>
          <p className="font-medium text-emerald-300">Fix</p>
          <p>{fix}</p>
        </div>
        {!isPaid && (
          <p className="text-[11px] text-muted-foreground">
            Upgrade to Pro or Lifetime to get tailored rewrites for this section.
          </p>
        )}
        {error && (
          <p className="text-[11px] text-red-400">
            {error}
          </p>
        )}
        {alternatives && alternatives.length > 0 && (
          <div className="mt-2 space-y-2 rounded-md border border-border/60 bg-background/60 p-3">
            <p className="text-[11px] font-medium text-foreground">
              Rewrite ideas you can paste into your resume
            </p>
            <ul className="space-y-2">
              {alternatives.map((alt, idx) => (
                <li
                  key={idx}
                  className="rounded-md border border-border/60 bg-card/80 p-2 text-[11px] md:text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="whitespace-pre-line">{alt}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-[10px] px-2 py-0 h-7"
                      onClick={() => handleCopy(alt)}
                    >
                      Copy
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

