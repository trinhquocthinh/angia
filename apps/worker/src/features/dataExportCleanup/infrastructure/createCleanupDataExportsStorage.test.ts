import { DeleteObjectCommand, ListObjectsV2Command, type S3Client } from '@aws-sdk/client-s3';
import { expect, it, vi } from 'vitest';
import { createCleanupDataExportsStorage } from './createCleanupDataExportsStorage.js';

it('TC-825: liệt kê đủ trang tiền tố exports và xoá đúng bucket', async () => {
  const send = vi
    .fn()
    .mockResolvedValueOnce({
      Contents: [{ Key: 'exports/a.zip' }, {}],
      IsTruncated: true,
      NextContinuationToken: 'trang-2',
    })
    .mockResolvedValueOnce({ Contents: [{ Key: 'exports/b.zip' }], IsTruncated: false })
    .mockResolvedValue({});
  const storage = createCleanupDataExportsStorage({ send } as unknown as S3Client, 'bucket');
  const keys = [];
  for await (const key of storage.list()) keys.push(key);
  expect(keys).toEqual(['exports/a.zip', 'exports/b.zip']);
  expect(send.mock.calls[0]?.[0]).toBeInstanceOf(ListObjectsV2Command);
  expect(send.mock.calls[0]?.[0].input).toEqual({ Bucket: 'bucket', Prefix: 'exports/' });
  expect(send.mock.calls[1]?.[0].input.ContinuationToken).toBe('trang-2');
  await storage.delete('exports/a.zip');
  expect(send.mock.calls[2]?.[0]).toBeInstanceOf(DeleteObjectCommand);
  expect(send.mock.calls[2]?.[0].input).toEqual({ Bucket: 'bucket', Key: 'exports/a.zip' });
});
it('TC-825: NoSuchKey coi như đã xoá, lỗi khác truyền lại để thử sau', async () => {
  const send = vi
    .fn()
    .mockRejectedValueOnce(Object.assign(new Error(), { name: 'NoSuchKey' }))
    .mockRejectedValueOnce(new Error('S3'));
  const storage = createCleanupDataExportsStorage({ send } as unknown as S3Client, 'bucket');
  await expect(storage.delete('exports/a.zip')).resolves.toBeUndefined();
  await expect(storage.delete('exports/b.zip')).rejects.toThrow('S3');
});
it('TC-825: trang bị cắt mà thiếu token báo lỗi để pg-boss thử lại', async () => {
  const send = vi.fn().mockResolvedValue({ IsTruncated: true });
  const storage = createCleanupDataExportsStorage({ send } as unknown as S3Client, 'bucket');
  const consume = async () => {
    for await (const key of storage.list()) void key;
  };
  await expect(consume()).rejects.toThrow('data_export_list_token_missing');
});
