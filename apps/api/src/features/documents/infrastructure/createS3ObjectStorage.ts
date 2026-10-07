import { DeleteObjectCommand, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import type { ObjectStorage } from '../application/ports.js';

export function createS3ObjectStorage(client: S3Client, bucket: string): ObjectStorage {
  return {
    put: async (key, body, contentType) => {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ContentLength: body.length,
        }),
      );
    },
    delete: async (key) => {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
