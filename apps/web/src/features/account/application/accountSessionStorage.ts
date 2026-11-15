export const RESTRICTED_CSRF_KEY = 'angia.restrictedCsrf';
export const ENROLL_LATER_KEY = 'angia.enrollLater';
export const ENROLL_REAUTH_KEY = 'angia.enrollReauth';
export function readAccountStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
export function writeAccountStorage(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* Bộ nhớ của trình duyệt có thể bị chặn. */
  }
}
