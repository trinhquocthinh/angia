export function isVerifiedEmailConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if (
    'code' in error &&
    error.code === '23505' &&
    'constraint' in error &&
    error.constraint === 'accounts_verified_email_unique'
  )
    return true;
  return 'cause' in error && error.cause !== error && isVerifiedEmailConflict(error.cause);
}
