import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FamilyCards } from './FamilyCards';

const families = [
  { id: 'f', name: 'Nhà An', createdAt: '2026-10-05T00:00:00Z' },
  { id: 'g', name: 'Nhà Bình', createdAt: '2026-10-06T00:00:00Z' },
];
const accounts = [
  { id: 'a', displayName: 'An', isSystemAdmin: false, familyId: 'f', role: 'main' as const },
  { id: 'b', displayName: 'Bình', isSystemAdmin: false, familyId: 'f', role: 'member' as const },
];

describe('Thẻ nhóm gia đình', () => {
  it('BR-003: chỉ hiện số liệu tài khoản, không có số liệu sức khỏe của gia đình', () => {
    const html = renderToStaticMarkup(
      <FamilyCards families={families} accounts={accounts} currentFamilyId="f" />,
    );
    expect(html).toContain('2 tài khoản');
    expect(html).toContain('Quản trị chính');
    expect(html).not.toMatch(/Hồ sơ khám|Đơn thuốc/);
  });
  it('chỉ gắn nhãn cho nhóm của người đang xem, nhóm khác không có nhãn thừa', () => {
    const html = renderToStaticMarkup(
      <FamilyCards families={families} accounts={accounts} currentFamilyId="f" />,
    );
    expect(html.match(/Nhóm của bạn/g)).toHaveLength(1);
    expect(html).not.toContain('>Gia đình<');
  });
});
