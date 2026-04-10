/**
 * Flattens common API envelope shapes so `/auth/me` fields are read reliably
 * (e.g. `{ data: { user: { id, referralCode } } }` or `{ data: { ... } }`).
 */
export function flattenMeResponse(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const acc: Record<string, unknown> = {};
  const queue: unknown[] = [raw];
  let steps = 0;
  while (queue.length > 0 && steps < 12) {
    steps += 1;
    const item = queue.shift();
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    Object.assign(acc, o);
    const nest = o.data ?? o.user ?? o.result ?? o.payload;
    if (nest && typeof nest === 'object' && !Array.isArray(nest)) {
      queue.push(nest);
    }
  }
  return acc;
}
