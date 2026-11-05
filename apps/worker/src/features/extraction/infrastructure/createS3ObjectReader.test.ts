import { Readable } from 'node:stream';
import { buffer } from 'node:stream/consumers';
import type { S3Client } from '@aws-sdk/client-s3';
import { expect, it, vi } from 'vitest';
import { createS3ObjectReader } from './createS3ObjectReader.js';

it('đọc tối đa 10 MiB, giữ nguyên byte và đóng stream ngay khi vượt giới hạn', async () => {
  const send = vi.fn();
  const reader = createS3ObjectReader({ send } as unknown as S3Client, 'bucket');
  const small = Readable.from([Buffer.from([1, 2, 3])]);
  send.mockResolvedValueOnce({ Body: Object.assign(small, { transformToByteArray: () => buffer(small) }) });
  expect([...(await reader.get('image'))]).toEqual([1, 2, 3]);
  const body = Readable.from([Buffer.alloc(10 * 1024 * 1024), Buffer.from([1])]);
  Object.assign(body, { transformToByteArray: () => buffer(body) });
  send.mockResolvedValueOnce({ Body: body });
  await expect(reader.get('oversized')).rejects.toThrow('image_unusable');
  expect(body.destroyed).toBe(true);
});
