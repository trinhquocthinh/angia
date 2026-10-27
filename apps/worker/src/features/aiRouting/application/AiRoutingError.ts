export type AiRoutingErrorCode =
  | 'routing_unavailable'
  | 'routing_invalid'
  | 'woku_live_unavailable'
  | 'openrouter_key_missing'
  | 'billing_source_missing';

/** Chỉ mã cố định được lưu vào pg-boss/log; không gắn cause hoặc dữ liệu DB/upstream. */
export class AiRoutingError extends Error {
  constructor(readonly code: AiRoutingErrorCode) {
    super(code);
    this.name = 'AiRoutingError';
  }
}
