import { Readable } from 'node:stream';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { expect, it, vi } from 'vitest';
import { createPrivacyStorage } from './createPrivacyStorage.js';
it('TC-195: S3 streaming chặn hơn 10 MiB kể cả thiếu ContentLength và đóng stream sớm', async () => {
  for (const contentLength of [undefined, 10 * 1024 * 1024 + 1]) {
    const body = Readable.from([Buffer.alloc(6 * 1024 * 1024), Buffer.alloc(5 * 1024 * 1024)]);
    const destroy = vi.spyOn(body, 'destroy');
    const client = {
      send: vi.fn(async (_command: unknown) => ({ Body: body, ContentLength: contentLength })),
    };
    await expect(
      createPrivacyStorage(client as unknown as S3Client, 'bucket').get('original'),
    ).rejects.toThrow('image_unusable');
    expect(destroy).toHaveBeenCalled();
  }
});
it('TC-195a: lưu đúng PNG riêng của attempt và xóa đúng key', async () => {
  const client = {
    send: vi.fn(async (_command: unknown) => ({
      Body: Readable.from([new Uint8Array([1, 2])]),
      ContentLength: 2,
    })),
  };
  const storage = createPrivacyStorage(client as unknown as S3Client, 'bucket');
  expect([...(await storage.get('original'))]).toEqual([1, 2]);
  expect(client.send.mock.calls[0]?.[0]).toBeInstanceOf(GetObjectCommand);
  await storage.put('attempt.png', new Uint8Array([3]));
  expect(client.send.mock.calls[1]?.[0]).toBeInstanceOf(PutObjectCommand);
  expect((client.send.mock.calls[1]?.[0] as unknown as PutObjectCommand).input).toMatchObject({
    Key: 'attempt.png',
    ContentType: 'image/png',
    ContentLength: 1,
    Body: new Uint8Array([3]),
  });
  await storage.delete('attempt.png');
  expect(client.send.mock.calls[2]?.[0]).toBeInstanceOf(DeleteObjectCommand);
  expect((client.send.mock.calls[2]?.[0] as unknown as DeleteObjectCommand).input.Key).toBe('attempt.png');
});
