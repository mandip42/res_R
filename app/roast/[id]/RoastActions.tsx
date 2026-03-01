"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type RoastActionsProps = {
  roastId: string;
  plan?: "free" | "pro" | "lifetime";
};

export function RoastActions({ roastId, plan = "free" }: RoastActionsProps) {
  const [copied, setCopied] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
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
  );
}
