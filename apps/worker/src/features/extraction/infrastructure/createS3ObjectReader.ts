import { GetObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import type { ObjectReader } from '../application/ports.js';
import { ImageConversionError } from '../application/ImageConversionError.js';

export function createS3ObjectReader(client: S3Client, bucket: string): ObjectReader {
  return {
    get: async (key) => {
      const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }), {
        abortSignal: AbortSignal.timeout(30_000),
      });
      if (!object.Body) throw new Error('Object S3 rỗng');
      const chunks: Uint8Array[] = [];
      let size = 0;
      for await (const chunk of object.Body as AsyncIterable<Uint8Array>) {
        size += chunk.byteLength;
        if (size > 10 * 1024 * 1024) throw new ImageConversionError();
        chunks.push(chunk);
      }
      return Buffer.concat(chunks, size);
    },
  };
}
