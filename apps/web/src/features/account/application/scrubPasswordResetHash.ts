/** Xoá fragment khỏi URL để tránh lọt token qua Referrer hoặc lịch sử trình duyệt. */
export function scrubPasswordResetHash(): void {
  const location = globalThis.location;
  const history = globalThis.history;
  if (!location?.hash || !history?.replaceState) return;
  history.replaceState(history.state ?? null, '', `${location.pathname ?? ''}${location.search ?? ''}`);
}
