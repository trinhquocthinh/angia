import { GetObjectCommand, NoSuchKey, type S3Client } from '@aws-sdk/client-s3';
import type { ObjectReader } from '../application/reviewPorts.js';

// Stream thẳng từ S3 qua API, không đệm cả ảnh vào bộ nhớ (API mem_limit 256 MB).
export function createS3ObjectReader(client: S3Client, bucket: string): ObjectReader {
  return {
    get: async (key) => {
      try {
        const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        if (!object.Body) return null;
        return {
          body: object.Body.transformToWebStream() as ReadableStream<Uint8Array>,
          contentType: object.ContentType ?? 'application/octet-stream',
        };
      } catch (error) {
        if (error instanceof NoSuchKey) return null;
        throw error;
      }
    },
  };
}
