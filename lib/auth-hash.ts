/**
 * Parse Supabase auth tokens from URL hash (e.g. after redirect from email link).
 * Format: #access_token=...&refresh_token=...&type=recovery (or type=signup/magiclink)
 */
export function getTokensFromHash(): { access_token: string; refresh_token: string } | null {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (access_token && refresh_token) return { access_token, refresh_token };
  return null;
}

/** Remove auth params from hash so they don't linger in URL. */
export function clearAuthHash(): void {
  if (typeof window === "undefined") return;
  const withoutHash = window.location.pathname + window.location.search;
  window.history.replaceState(null, "", withoutHash);
}
