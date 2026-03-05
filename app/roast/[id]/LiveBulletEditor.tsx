"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type LiveBulletEditorProps = {
  roastId: string;
  isJobCompare: boolean;
};

/**
 * CVComp-style live editor: paste any bullet, get improved versions right in the browser.
 * No paywall — available to all logged-in users.
 */
export function LiveBulletEditor({ roastId, isJobCompare }: LiveBulletEditorProps) {
  const [bullet, setBullet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<string[] | null>(null);

  async function handleImprove() {
    const trimmed = bullet.trim();
    if (!trimmed || trimmed.length < 10) {
      setError("Enter or paste at least one bullet point to improve.");
      return;
    }
    setLoading(true);
    setError(null);
    setAlternatives(null);
    try {
      const res = await fetch(`/api/roast/${roastId}/improve-bullet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to improve bullet. Try again.");
        return;
      }
      setAlternatives(data.alternatives ?? []);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // best-effort
    }
  }

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle className="text-sm md:text-base">
          Live bullet editor
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Paste a bullet point below and get stronger versions to drop into your resume.
          {isJobCompare && " Suggestions are tailored to your job."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground md:text-sm">
        <textarea
          className="min-h-[80px] w-full rounded-md border border-border/70 bg-background/60 px-3 py-2 text-xs outline-none ring-0 focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="e.g. Helped the team improve performance by doing code reviews"
          value={bullet}
          onChange={(e) => setBullet(e.target.value)}
          disabled={loading}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleImprove}
          disabled={loading || !bullet.trim()}
        >
          {loading ? "Improving…" : "Get improved versions"}
        </Button>
        {error && (
          <p className="text-[11px] text-red-400">{error}</p>
        )}
        {alternatives && alternatives.length > 0 && (
          <div className="mt-3 space-y-2 rounded-md border border-border/60 bg-background/60 p-3">
            <p className="text-[11px] font-medium text-foreground">
              Copy and paste into your resume
            </p>
            <ul className="space-y-2">
              {alternatives.map((alt, idx) => (
                <li
                  key={idx}
                  className="flex items-start justify-between gap-2 rounded-md border border-border/60 bg-card/80 p-2 text-[11px] md:text-xs"
                >
                  <p className="whitespace-pre-line flex-1">{alt}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-[10px] px-2 py-0 h-7"
                    onClick={() => copyToClipboard(alt)}
                  >
                    Copy
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
