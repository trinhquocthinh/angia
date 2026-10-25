import { DeleteObjectCommand, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { createS3ObjectReader } from '../../extraction/infrastructure/createS3ObjectReader.js';
import type { PreviewStorage } from '../application/ports.js';

export function createPreviewStorage(client: S3Client, bucket: string): PreviewStorage {
  const reader = createS3ObjectReader(client, bucket);
  return {
    get: reader.get,
    put: async (key, bytes) => {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentType: 'image/webp',
          ContentLength: bytes.length,
        }),
      );
    },
    delete: async (key) => {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
