import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { useSelfReportedCourse } from '../application/useSelfReportedCourse';
import { SelfReportedCourseSheetBody } from './SelfReportedCourseSheetBody';
const profile: HealthProfile = {
  id: 'p',
  familyId: 'f',
  displayName: 'Bà ngoại',
  birthYear: null,
  consentConfirmedAt: null,
  consentConfirmedBy: null,
  consentBasis: null,
  createdAt: '2026-10-01T00:00:00Z',
  consentStatus: 'confirmed',
  consentSource: null,
  consentRespondentName: null,
};
const state: ReturnType<typeof useSelfReportedCourse> = {
  pending: false,
  saved: null,
  error: null,
  request: null,
  prompt: null,
  submit: async () => undefined,
  reset: () => undefined,
};
const request = {
  name: 'Canxi',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'] as 'morning'[],
  startDate: '2026-10-01',
};
const old = {
  id: 'old-1',
  name: 'Canxi',
  strength: '250mg',
  quantityPerDose: 0.5,
  doseUnit: 'viên',
  slots: ['evening'] as 'evening'[],
  startDate: '2026-09-01',
  endDate: null,
};
const render = (changes: Partial<typeof state> = {}, consent = profile.consentStatus) =>
  renderToStaticMarkup(
    <SelfReportedCourseSheetBody
      profile={{ ...profile, consentStatus: consent }}
      state={{ ...state, ...changes }}
      onClose={() => undefined}
    />,
  );
describe('Sheet khai báo thuốc bổ', () => {
  it('TC-049: nhập tên/hàm lượng/liều/đơn vị/ngày, không chọn sẵn buổi', () => {
    const html = render();
    for (const name of ['name', 'strength', 'quantityPerDose', 'doseUnit', 'startDate'])
      expect(html).toContain(`name="${name}"`);
    expect(html).not.toContain('aria-pressed="true"');
    expect(html).toContain('dài hạn');
  });
  it('TC-049: đối soát liệt kê mọi đợt, khóa form, không chọn sẵn hoặc cho lưu', () => {
    const html = render({
      prompt: {
        request,
        conflicts: [
          {
            itemIndexes: [0],
            nameNormalized: 'canxi',
            courses: [old, { ...old, id: 'old-2', strength: '500mg' }],
          },
        ],
      },
    });
    expect(html).toMatch(/<fieldset disabled=""/);
    expect(html).toContain('250mg');
    expect(html).toContain('500mg');
    expect(html).not.toContain('checked=""');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Lưu với lựa chọn này/);
    expect(html).toContain('Sửa lại khai báo');
  });
  it('TC-049: đang lưu khóa cả đóng sheet và form', () => {
    const html = render({ pending: true });
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Đóng khai báo thuốc bổ"/);
    expect(html).toMatch(/<fieldset disabled=""/);
    expect(html).toContain('Đang lưu…');
  });
  it('TC-049: chưa đồng thuận không hiển thị form', () => {
    const html = render({}, 'pending');
    expect(html).toContain('Hồ sơ chưa được đồng ý lưu dữ liệu.');
    expect(html).not.toContain('<form');
  });
  it('TC-049: xung đột biến mất vẫn hiển thị đối soát và khóa lưu khi chưa xác nhận lại', () => {
    const html = render({
      prompt: { request, conflicts: [{ itemIndexes: [0], nameNormalized: 'canxi', courses: [] }] },
    });
    expect(html).toContain('Danh sách đã thay đổi: hiện không còn đợt trùng tên có hiệu lực.');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Lưu với lựa chọn này/);
  });
});
