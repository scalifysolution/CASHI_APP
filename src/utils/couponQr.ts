export function buildCouponQrPayload(args: {
  assignmentId: string;
  userId?: string | null;
  couponId?: string | null;
  shopId?: string | null;
}): string {
  const assignmentId = String(args.assignmentId ?? '').trim();
  const userId = args.userId != null ? String(args.userId).trim() : null;
  const couponId = args.couponId != null ? String(args.couponId).trim() : null;
  const shopId = args.shopId != null ? String(args.shopId).trim() : null;

  return JSON.stringify({
    v: 1,
    app: 'cashi',
    type: 'coupon',
    assignmentId,
    userId: userId || null,
    couponId: couponId || null,
    shopId: shopId || null,
  });
}

