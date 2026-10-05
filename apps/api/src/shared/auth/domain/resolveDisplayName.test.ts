import { describe, expect, it } from 'vitest';
import { resolveDisplayName } from './resolveDisplayName.js';

describe('resolveDisplayName', () => {
  it('ưu tiên claim name', () => {
    expect(
      resolveDisplayName({
        subject: 's',
        name: 'Trịnh Thịnh',
        preferredUsername: 'thinh',
        email: 'a@b.c',
        groups: [],
      }),
    ).toBe('Trịnh Thịnh');
  });

  it('thiếu name thì dùng preferred_username', () => {
    expect(resolveDisplayName({ subject: 's', preferredUsername: 'thinh', email: 'a@b.c', groups: [] })).toBe(
      'thinh',
    );
  });

  it('thiếu name và preferred_username thì dùng email', () => {
    expect(resolveDisplayName({ subject: 's', email: 'a@b.c', groups: [] })).toBe('a@b.c');
  });

  it('bỏ qua claim chỉ toàn khoảng trắng và cắt khoảng trắng hai đầu', () => {
    expect(
      resolveDisplayName({ subject: 's', name: '   ', preferredUsername: '  thinh  ', groups: [] }),
    ).toBe('thinh');
  });

  it('không có claim nào thì dùng subject để cột display_name không rỗng', () => {
    expect(resolveDisplayName({ subject: 'hashed-sub', groups: [] })).toBe('hashed-sub');
  });
});
