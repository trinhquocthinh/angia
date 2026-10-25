// Thông điệp cố định để nghiệm thu E2-S2-T1: lần chạy lặp lại phải in "No pending migrations".
export function describeMigrationResult(applied: number): string {
  if (applied === 0) return 'No pending migrations';
  return `Applied ${applied} migration${applied === 1 ? '' : 's'}`;
}
