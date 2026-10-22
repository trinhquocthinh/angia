import type { FamilyUsage } from '@angia/contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { UploadPickNotices } from './UploadPickNotices';

const usage = (daily: number, pending: number): FamilyUsage => ({
  storage: { usedBytes: 0, limitBytes: 100 },
  dailyUploads: { used: daily, limit: 100, resetsAt: '2026-10-20T00:00:00+07:00' },
  pendingJobs: { used: pending, limit: 10 },
  aiOcr: { month: '2026-10', usedPercent: 0, anyUsed: false, exhausted: false },
});

describe('TC-302 — cảnh báo số ảnh chờ gửi vượt chỗ còn lại (SPEC-030)', () => {
  it('5 ảnh chờ gửi khi chỉ còn 3 chỗ → cảnh báo nêu số còn lại', () => {
    const html = renderToStaticMarkup(
      <UploadPickNotices tooMany={false} usage={usage(95, 7)} readyCount={5} />,
    );
    expect(html).toContain('Gia đình chỉ còn gửi được 3 ảnh lúc này.');
  });

  it('vừa đủ chỗ, chưa có mức dùng, hoặc đã khóa vì chạm trần → không cảnh báo trùng', () => {
    const quiet = [
      <UploadPickNotices key="a" tooMany={false} usage={usage(95, 7)} readyCount={3} />,
      <UploadPickNotices key="b" tooMany={false} usage={null} readyCount={30} />,
      <UploadPickNotices key="c" tooMany={false} usage={usage(100, 0)} readyCount={2} />,
    ];
    for (const element of quiet) expect(renderToStaticMarkup(element)).toBe('');
  });
});
