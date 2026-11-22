import { expect, it } from 'vitest';
import { exportJson } from './exportJson.js';

it('TC-819: giữ tên DB và dữ liệu, bỏ family, khóa ảnh, hash và token cả trong JSON lồng', () => {
  const row = {
    id: 'p',
    display_name: 'Mẹ',
    family_id: 'f',
    image_key: 'private',
    image_sha256: 'hash',
    password_hash: 'secret',
    access_token: 'secret',
    medications: [{ name: 'Thuốc', token: 'secret', sha256: 'hash' }],
  };
  expect(JSON.parse(exportJson(row))).toEqual({
    id: 'p',
    display_name: 'Mẹ',
    medications: [{ name: 'Thuốc' }],
  });
});
