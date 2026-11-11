import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SelfReminder } from '@angia/contracts';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { vietnamDate } from '@src/features/visitSummary/application/vietnamDate';
import { profileDayRemindersKey } from '../application/profileDayRemindersKey';
import { ProfileDayReminders } from './ProfileDayReminders';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
  features: { redactionSuggestions: false },
};
const profile = { id: 'p', consentStatus: 'confirmed' } as HealthProfile;
const reminder: SelfReminder = {
  id: 'r',
  date: '2026-11-02',
  slot: 'morning',
  scheduledAt: '2026-11-02T00:00:00.000Z',
  medications: [{ name: 'Amlodipin', strength: '5 mg', quantityPerDose: '1', doseUnit: 'viên' }],
  confirmation: null,
  canConfirm: true,
  canUndo: false,
};
function render(reminders: SelfReminder[]) {
  const client = new QueryClient();
  client.setQueryData([...profileDayRemindersKey(session), 'p', vietnamDate()], reminders);
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ProfileDayReminders profile={profile} session={session} />
    </QueryClientProvider>,
  );
  client.clear();
  return html;
}

describe('Lời nhắc của ngày cho main (SPEC-046)', () => {
  it('TC-487: main ghi thay từ danh sách khi API cho phép', () => {
    const html = render([reminder]);
    expect(html).toContain('Sáng · 07:00');
    expect(html).toContain('Amlodipin · 5 mg · 1 viên');
    expect(html).toContain('>Đã dùng</button>');
  });
  it('TC-488: main không được chỉ định chỉ đọc, không có nút', () => {
    const html = render([{ ...reminder, canConfirm: false }]);
    expect(html).toContain('Amlodipin');
    expect(html).not.toContain('<button');
  });
  it('không có lời nhắc thì không dựng nút xác nhận', () => {
    const html = render([]);
    expect(html).toContain('Hôm nay không có lời nhắc.');
    expect(html).not.toContain('<button');
  });
});
