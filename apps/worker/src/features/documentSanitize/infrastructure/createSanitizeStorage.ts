import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import type { SanitizeDependencies } from '../application/ports.js';

export function createSanitizeStorage(client: S3Client, bucket: string): SanitizeDependencies['storage'] {
  return {
    get: async (key) => {
      const { Body } = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!Body) throw new Error('image_body_missing');
      const chunks: Uint8Array[] = [];
      let size = 0;
      for await (const chunk of Body as AsyncIterable<Uint8Array>) {
        size += chunk.byteLength;
        if (size > 10 * 1024 * 1024) throw new ImageConversionError();
        chunks.push(chunk);
      }
      return Buffer.concat(chunks, size);
    },
    put: async (key, bytes) => {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentType: 'image/jpeg',
          ContentLength: bytes.byteLength,
        }),
      );
    },
    delete: async (key) => {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
