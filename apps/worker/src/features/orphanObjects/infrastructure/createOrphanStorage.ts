import { DeleteObjectCommand, ListObjectsV2Command, type S3Client } from '@aws-sdk/client-s3';
import type { OrphanStorage, StoredObject } from '../application/ports.js';

// Liệt kê theo trang; thiếu NextContinuationToken thì dừng để không lặp vô hạn. Thiếu LastModified → null (giữ).
export function createOrphanStorage(client: S3Client, bucket: string): OrphanStorage {
  return {
    async *list(prefix): AsyncIterable<StoredObject> {
      let token: string | undefined;
      do {
        const page = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ...(token ? { ContinuationToken: token } : {}),
          }),
        );
        for (const item of page.Contents ?? [])
          if (item.Key) yield { key: item.Key, lastModified: item.LastModified ?? null };
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (token);
    },
    delete: async (key) => {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
