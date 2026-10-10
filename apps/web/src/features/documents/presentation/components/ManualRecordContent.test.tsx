import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import { ManualRecordContent } from './ManualRecordContent';

const profile = (consentStatus: HealthProfile['consentStatus']) =>
  ({ id: 'p-1', displayName: 'Mẹ', consentStatus }) as HealthProfile;
const props = {
  saved: false,
  pending: false,
  error: null,
  onSubmit: () => undefined,
  onAgain: () => undefined,
  onBack: () => undefined,
};

describe('Nhập trực tiếp không kèm ảnh (SPEC-011, BR-014)', () => {
  it('hồ sơ đã đồng thuận → form chọn loại, ghi rõ dữ liệu là nhập tay không kèm chứng từ gốc', () => {
    const html = renderToStaticMarkup(<ManualRecordContent {...props} profile={profile('confirmed')} />);
    expect(html).toContain('Nhập tay cho Mẹ');
    expect(html).toContain('không kèm chứng từ gốc');
    expect(html).toContain('Loại dữ liệu');
  });

  it('SPEC-012: cảnh báo nghi trùng hiện dưới form nhập', () => {
    const notice = <p>Giấy tờ này có vẻ đã được lưu trước đó</p>;
    const html = renderToStaticMarkup(
      <ManualRecordContent {...props} profile={profile('confirmed')} notice={notice} />,
    );
    expect(html).toContain('Giấy tờ này có vẻ đã được lưu trước đó');
  });

  it('BR-009: hồ sơ chưa đồng thuận → không hiện form', () => {
    const html = renderToStaticMarkup(<ManualRecordContent {...props} profile={profile('invited')} />);
    expect(html).toContain('Hồ sơ chưa được đồng ý lưu dữ liệu');
    expect(html).not.toContain('Loại dữ liệu');
  });

  it('lưu xong → báo đã lưu, cho nhập thêm hoặc về hồ sơ', () => {
    const html = renderToStaticMarkup(
      <ManualRecordContent {...props} profile={profile('confirmed')} saved={true} />,
    );
    expect(html).toContain('Đã lưu vào sổ');
    expect(html).toContain('Nhập thêm');
    expect(html).not.toContain('Loại dữ liệu');
  });

  it('không tìm thấy hồ sơ trong gia đình → thông báo', () => {
    const html = renderToStaticMarkup(<ManualRecordContent {...props} profile={null} />);
    expect(html).toContain('Không tìm thấy hồ sơ này trong gia đình.');
  });
});
