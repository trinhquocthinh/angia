import { describe, expect, it } from 'vitest';
import { describePushState } from './describePushState';

const ready = { enabled: true, publicKey: 'k', registered: false };
describe('Trạng thái thông báo trên thiết bị', () => {
  it('đang tải cấu hình → chờ kiểm tra', () => {
    expect(describePushState({ data: undefined, error: false, support: null })).toEqual({
      tone: 'neutral',
      label: 'Đang kiểm tra',
      detail: 'Đang kiểm tra đăng ký trên thiết bị này…',
    });
  });
  it('lỗi đọc cấu hình → báo lỗi, không suy diễn đã bật', () => {
    expect(describePushState({ data: undefined, error: true, support: null }).tone).toBe('warning');
  });
  it('trình duyệt không hỗ trợ → ưu tiên lý do không hỗ trợ', () => {
    const state = describePushState({ data: { ...ready, registered: true }, error: false, support: 'x' });
    expect(state).toMatchObject({ tone: 'warning', label: 'Chưa hỗ trợ' });
  });
  it('máy chủ chưa bật Web Push → tạm ngưng', () => {
    const state = describePushState({ data: { ...ready, enabled: false }, error: false, support: null });
    expect(state).toMatchObject({ tone: 'warning', label: 'Máy chủ chưa bật' });
  });
  it('thiếu khóa công khai cũng coi như máy chủ chưa bật', () => {
    const state = describePushState({ data: { ...ready, publicKey: null }, error: false, support: null });
    expect(state.label).toBe('Máy chủ chưa bật');
  });
  it('đã đăng ký → đang hoạt động', () => {
    const state = describePushState({ data: { ...ready, registered: true }, error: false, support: null });
    expect(state).toMatchObject({ tone: 'active', label: 'Đang hoạt động' });
  });
  it('sẵn sàng nhưng chưa đăng ký → chưa bật', () => {
    expect(describePushState({ data: ready, error: false, support: null })).toMatchObject({
      tone: 'neutral',
      label: 'Chưa bật',
    });
  });
});
