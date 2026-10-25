import { DeleteObjectsCommand, ListObjectsV2Command, type S3Client } from '@aws-sdk/client-s3';
import { expect, it, vi } from 'vitest';
import { createProfileObjectStorage } from './createProfileObjectStorage.js';

const keys = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ Key: `p/k${from + i}` }));

function fakeClient(pages: object[], deleteResponse: object = {}) {
  return {
    send: vi.fn(async (command: unknown) =>
      command instanceof ListObjectsV2Command ? (pages.shift() ?? {}) : deleteResponse,
    ),
  };
}
const deletes = (client: ReturnType<typeof fakeClient>) =>
  client.send.mock.calls
    .map(([command]) => command)
    .filter((command): command is DeleteObjectsCommand => command instanceof DeleteObjectsCommand);

it('TC-367: phân trang ListObjectsV2 và xóa theo lô DeleteObjects tối đa 1000 khóa', async () => {
  const client = fakeClient([
    { Contents: keys(0, 1000), IsTruncated: true, NextContinuationToken: 't1' },
    { Contents: [...keys(1000, 500), { Key: undefined }], IsTruncated: false },
  ]);
  const storage = createProfileObjectStorage(client as unknown as S3Client, 'bucket');
  expect(await storage.deletePrefix('p/')).toBe(1500);
  const lists = client.send.mock.calls.map(([c]) => c).filter((c) => c instanceof ListObjectsV2Command);
  expect((lists[1] as ListObjectsV2Command).input).toEqual({
    Bucket: 'bucket',
    Prefix: 'p/',
    ContinuationToken: 't1',
  });
  const batches = deletes(client);
  expect(batches.map((c) => c.input.Delete?.Objects?.length)).toEqual([1000, 500]);
  expect(batches[0]!.input).toMatchObject({ Bucket: 'bucket', Delete: { Quiet: true } });
  expect(batches[1]!.input.Delete?.Objects?.[0]).toEqual({ Key: 'p/k1000' });
});

it('TC-367: tiền tố rỗng → 0, không gọi DeleteObjects', async () => {
  const client = fakeClient([{ IsTruncated: false }]);
  expect(await createProfileObjectStorage(client as unknown as S3Client, 'b').deletePrefix('p/')).toBe(0);
  expect(deletes(client)).toEqual([]);
});

it('TC-367: response có Errors → ném lỗi không chứa khóa object', async () => {
  const client = fakeClient([{ Contents: keys(0, 2) }], { Errors: [{ Key: 'p/k1', Code: 'AccessDenied' }] });
  const run = createProfileObjectStorage(client as unknown as S3Client, 'b').deletePrefix('p/');
  await expect(run).rejects.toThrow();
  await run.catch((error: Error) => expect(error.message).not.toContain('p/k1'));
});

it('TC-367: IsTruncated nhưng thiếu NextContinuationToken → dừng', async () => {
  const client = fakeClient([{ Contents: keys(0, 1), IsTruncated: true }]);
  expect(await createProfileObjectStorage(client as unknown as S3Client, 'b').deletePrefix('p/')).toBe(1);
  expect(client.send).toHaveBeenCalledTimes(2);
});
