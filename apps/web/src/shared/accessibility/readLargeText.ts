export function readLargeText(): boolean {
  try {
    return localStorage.getItem('angia-large-text') === 'true';
  } catch {
    return false;
  }
}
