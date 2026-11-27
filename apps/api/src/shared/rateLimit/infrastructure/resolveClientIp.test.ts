import { describe, expect, it } from 'vitest';
import { parseTrustedProxyCidrs, resolveClientIp } from './resolveClientIp.js';

const trusted = parseTrustedProxyCidrs(['172.18.0.0/16', 'fd00::/8']);

describe('IP client sau reverse proxy tin cậy (SPEC-078, Tech Spec §10.4)', () => {
  it('socket ngoài dải tin cậy: bỏ qua X-Forwarded-For giả', () => {
    expect(resolveClientIp('203.0.113.9', '1.2.3.4', trusted)).toBe('203.0.113.9');
    expect(resolveClientIp('::ffff:203.0.113.9', '172.18.0.1', trusted)).toBe('203.0.113.9');
  });
  it('socket là proxy tin cậy: lấy hop đầu tiên không tin cậy tính từ phải', () => {
    expect(resolveClientIp('172.18.0.5', '198.51.100.7', trusted)).toBe('198.51.100.7');
    expect(resolveClientIp('::ffff:172.18.0.5', '9.9.9.9, 198.51.100.7, 172.18.0.2', trusted)).toBe(
      '198.51.100.7',
    );
    expect(resolveClientIp('fd00::1', '2001:db8::5', trusted)).toBe('2001:db8::5');
  });
  it('client giả chèn IP vào bên trái không đổi được khoá đếm', () => {
    const real = '198.51.100.7';
    for (const forged of ['1.1.1.1', '2.2.2.2, 3.3.3.3'])
      expect(resolveClientIp('172.18.0.5', `${forged}, ${real}`, trusted)).toBe(real);
  });
  it('proxy tin cậy nhưng header thiếu, rỗng hoặc hop gần nhất không hợp lệ: dùng IP proxy', () => {
    expect(resolveClientIp('172.18.0.5', undefined, trusted)).toBe('172.18.0.5');
    expect(resolveClientIp('172.18.0.5', '', trusted)).toBe('172.18.0.5');
    expect(resolveClientIp('172.18.0.5', '1.1.1.1, rác', trusted)).toBe('172.18.0.5');
    expect(resolveClientIp('172.18.0.5', '1.1.1.1, 198.51.100.7:4444', trusted)).toBe('172.18.0.5');
    expect(resolveClientIp('172.18.0.5', '172.18.0.3, 172.18.0.2', trusted)).toBe('172.18.0.5');
  });
  it('không cấu hình dải tin cậy: luôn dùng IP socket', () => {
    expect(resolveClientIp('172.18.0.5', '198.51.100.7', parseTrustedProxyCidrs([]))).toBe('172.18.0.5');
  });
  it('socket không có địa chỉ: trả unknown', () => {
    expect(resolveClientIp(undefined, '198.51.100.7', trusted)).toBe('unknown');
  });
  it.each(['172.18.0.0', '172.18.0.0/33', 'abc/8', '::/129', '10.0.0.0/8x'])(
    'từ chối CIDR không hợp lệ %s',
    (cidr) => {
      expect(() => parseTrustedProxyCidrs([cidr])).toThrow();
    },
  );
});
