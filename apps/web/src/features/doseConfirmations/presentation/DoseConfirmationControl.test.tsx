import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { useDoseConfirmation } from '../application/useDoseConfirmation';
import { DoseConfirmationControl } from './DoseConfirmationControl';

type DoseState = ReturnType<typeof useDoseConfirmation>;
const idle: DoseState = {
  pending: null,
  failure: null,
  confirm: async () => undefined,
  undo: async () => undefined,
};
let dose = idle;
vi.mock('../application/useDoseConfirmation', () => ({ useDoseConfirmation: () => dose }));

const session = { csrfToken: 'csrf' } as ProfileSession;
const confirmation = {
  reminderId: 'r',
  profileId: 'p',
  date: '2026-11-02',
  slot: 'morning' as const,
  confirmedBy: { accountId: 'a', displayName: 'Mẹ Hoa' },
  confirmedAt: '2026-11-02T00:35:00.000Z',
};
const open = { id: 'r', confirmation: null, canConfirm: true, canUndo: false };
const done = { id: 'r', confirmation, canConfirm: false, canUndo: true };
const render = (reminder: typeof open | typeof done) =>
  renderToStaticMarkup(<DoseConfirmationControl reminder={reminder} session={session} />);

beforeEach(() => {
  dose = idle;
});

describe('Nút "Đã dùng" theo quyền API (Design §9.6)', () => {
  it('TC-486: chưa xác nhận và canConfirm: có nút "Đã dùng"', () => {
    const html = render(open);
    expect(html).toContain('>Đã dùng</button>');
    expect(html).not.toContain('Hủy xác nhận');
  });
  it('TC-488: không có quyền và chưa ai bấm: không dựng gì', () => {
    expect(render({ ...open, canConfirm: false })).toBe('');
  });
  it('TC-486: đã xác nhận hiện người, giờ và nút hủy khi canUndo', () => {
    const html = render(done);
    expect(html).toContain('Đã dùng · Mẹ Hoa · 07:35');
    expect(html).toContain('Hủy xác nhận');
    expect(html).not.toContain('>Đã dùng</button>');
  });
  it('TC-489: ngày cũ chỉ đọc, không có nút ghi hay hủy', () => {
    const html = render({ ...done, canUndo: false });
    expect(html).toContain('Đã dùng · Mẹ Hoa · 07:35');
    expect(html).not.toContain('<button');
  });
  it('khóa nút và đổi nhãn khi đang gửi; không tự hiện tên người xác nhận', () => {
    dose = { ...idle, pending: 'confirm' };
    const html = render(open);
    expect(html).toContain('Đang xác nhận…');
    expect(html).toContain('disabled');
    expect(html).not.toContain('Đã dùng ·');
    dose = { ...idle, pending: 'undo' };
    const undoing = render(done);
    expect(undoing).toContain('Đang hủy…');
    expect(undoing).toContain('disabled');
  });
  it('lỗi máy chủ: giữ trạng thái đã biết, báo nội tuyến và có "Thử lại"', () => {
    dose = {
      ...idle,
      failure: { action: 'undo', error: new MedicationRequestError('Không thể cập nhật', 500) },
    };
    const html = render(done);
    expect(html).toContain('Đã dùng · Mẹ Hoa · 07:35');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Không thể cập nhật');
    expect(html).toContain('Thử lại');
  });
  it('TC-489: qua ngày giải thích và không có "Thử lại", kể cả khi quyền đã bị tắt', () => {
    dose = {
      ...idle,
      failure: { action: 'confirm', error: new MedicationRequestError('Ngoài ngày', 422) },
    };
    const html = render({ ...open, canConfirm: false });
    expect(html).toContain('Chỉ xác nhận hoặc hủy trong ngày của lời nhắc.');
    expect(html).not.toContain('Thử lại');
  });
  it('TC-493: không có tỷ lệ, cảnh báo hay chữ nhận định ở mọi trạng thái', () => {
    const html = [render(open), render(done), render({ ...open, canConfirm: false })].join('');
    for (const text of ['Chưa uống', 'Bỏ thuốc', 'Quên', 'tuân thủ', '%', 'Tốt', 'Xấu', 'Bất thường'])
      expect(html).not.toContain(text);
  });
});
