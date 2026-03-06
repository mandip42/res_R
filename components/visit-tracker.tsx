"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Fires a single POST to /api/track-visit on route change (pathname). No UI. */
export function VisitTracker() {
  const pathname = usePathname();
  const mounted = useRef(false);

  useEffect(() => {
    if (!pathname) return;
    // Avoid double fire in Strict Mode / initial mount
    if (!mounted.current) {
      mounted.current = true;
    }
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
