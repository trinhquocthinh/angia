import { DeleteObjectsCommand, ListObjectsV2Command, type S3Client } from '@aws-sdk/client-s3';
import type { ProfileObjectStorage } from '../application/ports.js';

// DeleteObjects nhận tối đa 1000 khóa/lần; mỗi trang ListObjectsV2 cũng ≤ 1000 nên xóa theo từng trang.
// Thiếu NextContinuationToken thì dừng để không lặp vô hạn. Lỗi không ghi khóa object (BR-010, log riêng tư).
export function createProfileObjectStorage(client: S3Client, bucket: string): ProfileObjectStorage {
  const removeBatch = async (keys: string[]) => {
    const result = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    if (result.Errors?.length) throw new Error(`DeleteObjects lỗi ${result.Errors.length} object`);
  };
  return {
    deletePrefix: async (prefix) => {
      let removed = 0;
      let token: string | undefined;
      do {
        const page = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ...(token ? { ContinuationToken: token } : {}),
          }),
        );
        const keys = (page.Contents ?? []).flatMap((item) => (item.Key ? [item.Key] : []));
        for (let start = 0; start < keys.length; start += 1000) {
          await removeBatch(keys.slice(start, start + 1000));
        }
        removed += keys.length;
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (token);
      return removed;
    },
  };
}
