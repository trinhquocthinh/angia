import { describe, expect, it } from 'vitest';
import { redactionConfirmDecision } from './redactionConfirmDecision';

const base = {
  choice: null,
  checked: false,
  aiBlocked: false,
  maskCount: 2,
  acknowledgedNoMask: false,
} as const;

describe('Bước "Xem bản sẽ tải lên" (BR-041, D5)', () => {
  it('TC-430 chưa chọn cách xử lý thì chưa xác nhận được', () => {
    expect(redactionConfirmDecision(base)).toBe('disabled');
  });

  it('TC-430 chọn gửi tự động nhận diện: cần tick xác nhận đã kiểm tra', () => {
    expect(redactionConfirmDecision({ ...base, choice: 'ai' })).toBe('disabled');
    expect(redactionConfirmDecision({ ...base, choice: 'ai', checked: true })).toBe('confirm');
  });

  it('TC-430 hàng chờ tự động nhận diện đã đủ thì không gửi AI được, vẫn tự nhập được', () => {
    expect(redactionConfirmDecision({ ...base, choice: 'ai', checked: true, aiBlocked: true })).toBe(
      'disabled',
    );
    expect(redactionConfirmDecision({ ...base, choice: 'manual', aiBlocked: true })).toBe('confirm');
  });

  it('TC-430 tự nhập không cần tick xác nhận gửi AI', () => {
    expect(redactionConfirmDecision({ ...base, choice: 'manual' })).toBe('confirm');
  });

  it('TC-431 không có vùng che nào thì hỏi lại trước khi xác nhận, kể cả khi tự nhập', () => {
    const noMask = { ...base, maskCount: 0 };
    expect(redactionConfirmDecision({ ...noMask, choice: 'manual' })).toBe('ask-no-mask');
    expect(redactionConfirmDecision({ ...noMask, choice: 'ai', checked: true })).toBe('ask-no-mask');
    expect(redactionConfirmDecision({ ...noMask, choice: 'ai' })).toBe('disabled');
    expect(redactionConfirmDecision({ ...noMask, choice: 'manual', acknowledgedNoMask: true })).toBe(
      'confirm',
    );
  });
});
