/**
 * Shared admin check: same list as dev plan switcher and unlimited roasts.
 * Uses ADMIN_EMAIL, ADMIN_EMAILS, or DEV_ADMIN_EMAILS (dev + production).
 */
const DEV_ADMIN_EMAILS = [
  "mandipgoswami25@gmail.com",
  "mandipgoswami@gmail.com",
  "ritusmitabaruah18@gmail.com",
];

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  if (DEV_ADMIN_EMAILS.includes(normalized)) return true;
  const single = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (single && single === normalized) return true;
  const list =
    process.env.ADMIN_EMAILS?.toLowerCase()
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean) ?? [];
  return list.includes(normalized);
}
