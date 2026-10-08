import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import type { PrivacyStorage } from '../application/ports.js';
const MAX_BYTES = 10 * 1024 * 1024;
export function createPrivacyStorage(client: S3Client, bucket: string): PrivacyStorage {
  return {
    get: async (key) => {
      const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!object.Body) throw new Error('Object S3 rỗng');
      const body = object.Body as unknown as AsyncIterable<Uint8Array> & { destroy?(): void };
      try {
        if ((object.ContentLength ?? 0) > MAX_BYTES) throw new ImageConversionError();
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of body) {
          size += chunk.byteLength;
          if (size > MAX_BYTES) throw new ImageConversionError();
          chunks.push(Buffer.from(chunk));
        }
        if (size === 0) throw new ImageConversionError();
        return Buffer.concat(chunks, size);
      } finally {
        body.destroy?.();
      }
    },
    put: async (key, bytes) => {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentType: 'image/png',
          ContentLength: bytes.byteLength,
        }),
      );
    },
    delete: async (key) => {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
