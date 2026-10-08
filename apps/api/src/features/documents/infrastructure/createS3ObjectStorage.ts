import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { DeleteObjectCommand, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import type { ObjectStorage } from '../application/ports.js';

export function createS3ObjectStorage(client: S3Client, bucket: string): ObjectStorage {
  return {
    // Luồng cần ContentLength biết trước; SDK không tự đệm cả tệp vào bộ nhớ.
    put: async (key, body, contentType, contentLength) => {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: Readable.fromWeb(body as NodeReadableStream<Uint8Array>),
          ContentType: contentType,
          ContentLength: contentLength,
        }),
      );
    },
    delete: async (key) => {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
