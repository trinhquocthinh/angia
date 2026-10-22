import type { PushConfiguration } from './ports';

export interface PushStateView {
  tone: 'active' | 'neutral' | 'warning';
  label: string;
  detail: string;
}

// Gom trạng thái đăng ký push thành nhãn hiển thị; chỉ dựa trên dữ liệu thật từ máy chủ và trình duyệt.
export function describePushState(input: {
  data: PushConfiguration | undefined;
  error: boolean;
  support: string | null;
}): PushStateView {
  const { data, error, support } = input;
  if (support) return { tone: 'warning', label: 'Chưa hỗ trợ', detail: support };
  if (error) return { tone: 'warning', label: 'Chưa đọc được', detail: 'Chưa đọc được cấu hình thông báo.' };
  if (!data)
    return { tone: 'neutral', label: 'Đang kiểm tra', detail: 'Đang kiểm tra đăng ký trên thiết bị này…' };
  if (!data.enabled || !data.publicKey)
    return {
      tone: 'warning',
      label: 'Máy chủ chưa bật',
      detail: 'Tính năng thông báo chưa được bật trên máy chủ.',
    };
  if (data.registered)
    return {
      tone: 'active',
      label: 'Đang hoạt động',
      detail: 'Trình duyệt này đã đăng ký nhận thông báo qua Web Push.',
    };
  return { tone: 'neutral', label: 'Chưa bật', detail: 'Thiết bị này chưa đăng ký nhận thông báo.' };
}
