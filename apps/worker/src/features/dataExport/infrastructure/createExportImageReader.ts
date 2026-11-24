import { GetObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import type { DataExportDependencies } from '../application/ports.js';

export function createExportImageReader(client: S3Client, bucket: string): DataExportDependencies['images'] {
  return {
    read: async function* (key) {
      const { Body } = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!Body) throw new Error('export_image_body_missing');
      let size = 0;
      for await (const chunk of Body as AsyncIterable<Uint8Array>) {
        size += chunk.byteLength;
        if (size > 10 * 1024 * 1024) throw new Error('export_image_too_large');
        for (let offset = 0; offset < chunk.length; offset += 65536) {
          yield chunk.subarray(offset, offset + 65536);
        }
      }
    },
  };
}
