export function identitySpikeError(error: unknown): string {
  if (
    error instanceof Error &&
    (error.message === 'ERR_ACCOUNT_LOCKED' || /^idp_[a-z_0-9]+$/.test(error.message))
  ) {
    return error.message;
  }
  return 'idp_spike_failed';
}
