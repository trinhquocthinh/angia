import { DeleteObjectCommand, ListObjectsV2Command, type S3Client } from '@aws-sdk/client-s3';
import { expect, it, vi } from 'vitest';
import { createOrphanStorage } from './createOrphanStorage.js';

const collect = async <T>(items: AsyncIterable<T>) => {
  const result: T[] = [];
  for await (const item of items) result.push(item);
  return result;
};

it('TC-320a: liệt kê S3 phân trang theo ContinuationToken và xóa đúng khóa', async () => {
  const d1 = new Date('2026-10-01T00:00:00Z');
  const pages = [
    {
      Contents: [{ Key: 'a', LastModified: d1 }, { Key: undefined }],
      IsTruncated: true,
      NextContinuationToken: 't1',
    },
    { Contents: [{ Key: 'b' }], IsTruncated: false },
  ];
  const client = { send: vi.fn(async (_command: unknown) => pages.shift() ?? {}) };
  const storage = createOrphanStorage(client as unknown as S3Client, 'bucket');
  expect(await collect(storage.list('families/x/'))).toEqual([
    { key: 'a', lastModified: d1 },
    { key: 'b', lastModified: null },
  ]);
  const second = client.send.mock.calls[1]?.[0] as ListObjectsV2Command;
  expect(second).toBeInstanceOf(ListObjectsV2Command);
  expect(second.input).toEqual({ Bucket: 'bucket', Prefix: 'families/x/', ContinuationToken: 't1' });

  await storage.delete('k');
  const removal = client.send.mock.calls[2]?.[0] as DeleteObjectCommand;
  expect(removal).toBeInstanceOf(DeleteObjectCommand);
  expect(removal.input).toEqual({ Bucket: 'bucket', Key: 'k' });
});

it('TC-320a: dừng phân trang khi IsTruncated nhưng thiếu NextContinuationToken', async () => {
  const client = {
    send: vi.fn(async (_command: unknown) => ({ Contents: [{ Key: 'a' }], IsTruncated: true })),
  };
  const storage = createOrphanStorage(client as unknown as S3Client, 'bucket');
  expect(await collect(storage.list('families/x/'))).toHaveLength(1);
  expect(client.send).toHaveBeenCalledTimes(1);
});
