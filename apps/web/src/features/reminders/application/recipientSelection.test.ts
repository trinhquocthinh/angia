import { describe, expect, it } from 'vitest';
import { toggleRecipient, validateRecipientSelection } from './recipientSelection';

describe('Chọn người nhận nhắc (SPEC-026)', () => {
  it('TC-069: bật/tắt người nhận giữ thứ tự chọn, không trùng', () => {
    expect(toggleRecipient(['dad'], 'mom')).toEqual(['dad', 'mom']);
    expect(toggleRecipient(['dad', 'mom'], 'dad')).toEqual(['mom']);
  });
  it('cần ít nhất một người nhận', () => {
    expect(validateRecipientSelection([])).toEqual({
      ok: false,
      message: 'Chọn ít nhất một người nhận nhắc.',
    });
    expect(validateRecipientSelection(['dad'])).toEqual({ ok: true, ids: ['dad'] });
  });
});
