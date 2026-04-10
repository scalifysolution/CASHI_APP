export function memberIdSuffix(userId: string | null | undefined, digits = 4): string {
  const raw = String(userId ?? '').trim();
  if (!raw) return ''.padStart(digits, '0');
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = cleaned.slice(-digits);
  return suffix.padStart(digits, '0');
}

export function memberIdMasked(userId: string | null | undefined): string {
  return `•••• ${memberIdSuffix(userId, 4)}`;
}

