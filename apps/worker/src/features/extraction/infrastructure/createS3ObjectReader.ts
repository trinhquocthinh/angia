import { GetObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import type { ObjectReader } from '../application/ports.js';

export function createS3ObjectReader(client: S3Client, bucket: string): ObjectReader {
  return {
    get: async (key) => {
      const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!object.Body) throw new Error('Object S3 rỗng');
      return object.Body.transformToByteArray();
    },
  };
}
