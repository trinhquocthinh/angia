import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hashInvitationSecret } from './hashInvitationSecret.js';

describe('Băm bí mật lời mời', () => {
  it('TC-775: mã điện thoại không phân biệt hoa thường, bỏ khoảng trắng hai đầu', () => {
    expect(hashInvitationSecret(' abc123456789 ')).toBe(
      createHash('sha256').update('ABC123456789').digest('hex'),
    );
  });
  it('TC-777: token giữ phân biệt hoa thường và không bị băm thẳng thành digest đầu vào', () => {
    expect(hashInvitationSecret('AbcdefToken')).not.toBe(hashInvitationSecret('abcdefToken'));
    expect(hashInvitationSecret('a'.repeat(64))).not.toBe('a'.repeat(64));
  });
});
