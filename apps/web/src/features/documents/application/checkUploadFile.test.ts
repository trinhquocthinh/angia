import { describe, expect, it } from 'vitest';
import { checkUploadFile } from './checkUploadFile';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const file = (name: string, type: string, size = 1024) =>
  ({ name, type, size }) as Pick<File, 'name' | 'type' | 'size'>;

describe('Kiểm tra tệp phía trình duyệt trước khi gửi (SPEC-008)', () => {
  it.each([
    file('don.jpg', 'image/jpeg'),
    file('xn.PNG', 'image/png'),
    file('a.webp', 'image/webp'),
    file('IMG_1.HEIC', ''),
    file('IMG_2.heif', 'image/heif'),
  ])('nhận ảnh hợp lệ %#', (input) => {
    expect(checkUploadFile(input)).toBeNull();
  });
  it('TC-024: PDF bị loại với lý do định dạng', () => {
    expect(checkUploadFile(file('hen.pdf', 'application/pdf'))).toBe('unsupported');
  });
  it('TC-080: đúng 10 MiB được nhận, thêm 1 byte bị loại vì dung lượng', () => {
    expect(checkUploadFile(file('a.jpg', 'image/jpeg', MAX_FILE_BYTES))).toBeNull();
    expect(checkUploadFile(file('a.jpg', 'image/jpeg', MAX_FILE_BYTES + 1))).toBe('too_large');
  });
});
