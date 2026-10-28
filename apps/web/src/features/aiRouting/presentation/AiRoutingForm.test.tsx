import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS } from '@angia/contracts';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { AiRoutingForm } from './AiRoutingForm';
import { AiRoutingSummary } from './AiRoutingSummary';

const initial = { version: 0, settings: DEFAULT_AI_ROUTING_SETTINGS, updatedAt: null, updatedBy: null };
const noop = () => undefined;
function form(pending = false, error: Error | null = null) {
  return renderToStaticMarkup(
    <AiRoutingForm
      initial={initial}
      pending={pending}
      error={error}
      onSave={noop}
      onCancel={noop}
      onReload={noop}
    />,
  );
}
describe('Form cấu hình nhận diện', () => {
  it('TC-507, TC-651: chỉ cặp model OpenRouter, không chọn nhà cung cấp, không có ô hệ số/key/URL', () => {
    const markup = form();
    expect(markup).toContain('Model chính OpenRouter');
    expect(markup).toContain('Model dự phòng OpenRouter');
    expect(markup).not.toContain('name="selectedProvider"');
    expect(markup).not.toContain('Woku');
    expect(markup).not.toContain('type="password"');
    expect(markup).not.toContain('name="apiKey"');
    expect(markup).not.toContain('name="baseUrl"');
  });
  it('TC-513: đang lưu khóa fieldset, không cho sửa/submit lặp', () => {
    expect(form(true)).toContain('fieldset disabled=""');
    expect(form(true)).toContain('Đang xử lý…');
  });
  it('TC-511: 409 có nút chủ động bỏ bản sửa, không tự đổi version', () => {
    const markup = form(false, new AdminRequestError('ERR_AI_ROUTING_CONFLICT', 409));
    expect(markup).toContain('Bản đang sửa vẫn được giữ');
    expect(markup).toContain('Bỏ bản sửa và tải cấu hình mới');
  });
  it('TC-513: lỗi mạng hiện câu cố định, không đưa message bất kỳ vào UI', () => {
    const markup = form(false, new Error('SYNTHETIC_PRIVATE_DETAIL'));
    expect(markup).not.toContain('SYNTHETIC_PRIVATE_DETAIL');
    expect(markup).toContain('Bản đang sửa vẫn được giữ lại');
  });
  it('TC-507: tóm tắt bootstrap không khẳng định dịch vụ đang hoạt động', () => {
    const markup = renderToStaticMarkup(<AiRoutingSummary view={initial} updatedByName={null} />);
    expect(markup).toContain('OpenRouter');
    expect(markup).not.toContain('Woku');
    expect(markup).not.toContain('Đang hoạt động');
  });
});
