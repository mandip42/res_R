"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type RoastActionsProps = {
  roastId: string;
};

export function RoastActions({ roastId }: RoastActionsProps) {
  const [copied, setCopied] = useState(false);

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
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard">Back to dashboard</Link>
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
    </div>
  );
}
