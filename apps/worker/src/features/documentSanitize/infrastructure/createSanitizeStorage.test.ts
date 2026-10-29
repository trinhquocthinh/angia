import { Readable } from 'node:stream';
import { type S3Client } from '@aws-sdk/client-s3';
import { expect, it, vi } from 'vitest';
import { createSanitizeStorage } from './createSanitizeStorage.js';

it('TC-417: đọc S3 có giới hạn byte, dừng stream quá lớn và giữ nguyên lỗi mạng', async () => {
  const send = vi.fn();
  const storage = createSanitizeStorage({ send } as unknown as S3Client, 'bucket');
  send.mockResolvedValueOnce({ Body: Readable.from([Buffer.from([1]), Buffer.from([2])]) });
  expect([...(await storage.get('key'))]).toEqual([1, 2]);
  const body = Readable.from([Buffer.alloc(10 * 1024 * 1024), Buffer.from([1])]);
  send.mockResolvedValueOnce({ Body: body });
  await expect(storage.get('key')).rejects.toThrow('image_unusable');
  expect(body.destroyed).toBe(true);
  send.mockRejectedValueOnce(new Error('network'));
  await expect(storage.get('key')).rejects.toThrow('network');
});

it('TC-416: lưu JPEG với ContentType/Length chính xác và xóa đúng khóa', async () => {
  const send = vi.fn().mockResolvedValue({});
  const storage = createSanitizeStorage({ send } as unknown as S3Client, 'bucket');
  await storage.put('new.jpg', new Uint8Array([1, 2]));
  expect(send.mock.calls[0]![0].input).toMatchObject({
    Bucket: 'bucket',
    Key: 'new.jpg',
    ContentType: 'image/jpeg',
    ContentLength: 2,
  });
  await storage.delete('old.jpg');
  expect(send.mock.calls[1]![0].input).toEqual({ Bucket: 'bucket', Key: 'old.jpg' });
});
