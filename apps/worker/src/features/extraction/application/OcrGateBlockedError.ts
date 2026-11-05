export type OcrGateReason =
  'scan_quota_exhausted' | 'budget_exhausted' | 'billing_unavailable' | 'dispatch_limit';

/** Lý do kỹ thuật có thể ghi log; không chứa dữ liệu sức khỏe. */
export class OcrGateBlockedError extends Error {
  constructor(readonly reason: OcrGateReason) {
    super(reason);
    this.name = 'OcrGateBlockedError';
  }
}
