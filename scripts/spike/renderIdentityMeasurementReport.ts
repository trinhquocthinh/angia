import type { IdentityRoundResult } from './runIdentityRound.js';
import type { summarizeIdentityMeasurements } from './summarizeIdentityMeasurements.js';

const format = (value: number | null | undefined) => (value == null ? '—' : value.toFixed(2));

export function renderIdentityMeasurementReport(
  rows: IdentityRoundResult[],
  summary: ReturnType<typeof summarizeIdentityMeasurements>,
  origin: string,
) {
  const steps = [
    'createUser',
    'login',
    'setPassword',
    'loginAfterChange',
    'oldPasswordDenied',
    'lock',
    'lockedLoginDenied',
    'unlock',
    'loginAfterUnlock',
    'deleteUser',
  ];
  const lines = [
    '# E24-S1-T2 — Bảng đo danh tính SIT',
    '',
    `Nguồn đo: ${origin.replace(/[|\r\n]/g, ' ')}. Đơn vị thời gian: ms.`,
    '',
    `Hoàn tất: ${summary.completed}/50; đã thử: ${summary.attempted}; tỷ lệ trên 50 vòng: ${summary.successRate * 100}%.`,
    `Trung vị đăng nhập đầu vòng: ${format(summary.medianLoginMs)} ms.`,
    `Trung vị sau đổi mật khẩu: ${format(summary.medianLoginAfterChangeMs)} ms; sau mở khoá: ${format(summary.medianLoginAfterUnlockMs)} ms.`,
    '',
    `Kết quả máy tính: **${summary.verdict}**. Chờ owner duyệt.`,
    'Đạt khi đủ 50/50 vòng, trung vị đăng nhập đầu vòng ≤ 1000 ms và chưa chạm trần 6 giờ.',
    'Không đạt: dừng; trình phương án B, ADR và ước lượng lại E26 trước khi triển khai tiếp.',
    '',
    `| Vòng | ${steps.join(' | ')} | Đạt | Bước lỗi | Lỗi | Lỗi dọn |`,
    `| ${Array.from({ length: steps.length + 5 }, () => '---').join(' | ')} |`,
  ];
  for (const row of rows) {
    lines.push(
      `| ${row.round} | ${steps.map((step) => format(row.timings[step])).join(' | ')} | ${row.success ? 'Có' : 'Không'} | ${row.failedStep ?? '—'} | ${row.error ?? '—'} | ${row.cleanupError ?? '—'} |`,
    );
  }
  return `${lines.join('\n')}\n`;
}
