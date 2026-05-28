/**
 * Public site URL used for Platega return links, metadata, etc.
 */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (url) return url;

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL is required in production");
  }

  return "http://localhost:3000";
}

export function getAppUrlOrNull(): string | null {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return url || null;
}
