/**
 * Payload embedded in the home-screen member QR. When a store scans it, they get this string
 * and can read `userId` (same id as Redux `user.id` / API user id).
 */
export function buildMemberQrPayload(userId: string | null | undefined): string {
  const id = (userId ?? '').trim();
  // Keep schema stable for scanners: always include userId as a string.
  return JSON.stringify({ v: 1, app: 'cashi', type: 'member', userId: id });
}

/** Parse a scanned QR string back to member userId (for merchant / POS integrations). */
export function parseMemberQrPayload(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const o = JSON.parse(t) as { userId?: unknown; type?: unknown };
    if (o && o.type === 'member' && typeof o.userId === 'string') {
      const id = o.userId.trim();
      return id.length > 0 ? id : null;
    }
    if (o && typeof o.userId === 'string') {
      const id = o.userId.trim();
      return id.length > 0 ? id : null;
    }
  } catch {
    // fall through
  }
  return null;
}
