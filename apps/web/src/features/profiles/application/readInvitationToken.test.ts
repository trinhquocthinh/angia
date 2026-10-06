import { describe, expect, it } from 'vitest';
import { readInvitationToken } from './readInvitationToken';
describe('TC-106 — Token lời mời chỉ đọc từ fragment', () => {
  it('đọc opaque token và không nhận query URL hoặc fragment không hợp lệ', () => {
    expect(readInvitationToken('#token=opaque-token_123')).toBeNull();
    expect(readInvitationToken('#token=v2.payload')).toBeNull();
    expect(readInvitationToken('#token=v1.' + 'a'.repeat(2048))).toBeNull();
    expect(readInvitationToken('#token=v1.a.b')).toBeNull();
    expect(readInvitationToken('#token=v1.encrypted_payload')).toBe('v1.encrypted_payload');
    expect(readInvitationToken('?token=secret')).toBeNull();
    expect(readInvitationToken('#token=')).toBeNull();
    expect(readInvitationToken('#token=one&token=two')).toBeNull();
  });
});
