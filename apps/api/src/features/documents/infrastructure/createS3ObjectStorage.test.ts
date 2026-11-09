import type { S3Client } from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';
import { expect, it } from 'vitest';
import { createS3ObjectStorage } from './createS3ObjectStorage.js';

it('hủy PUT treo và đóng stream đầu vào để transaction có thể rollback', async () => {
  let stream: Readable | undefined;
  const client = {
    send: (command: { input: { Body: Readable } }, options?: { abortSignal?: AbortSignal }) => {
      stream = command.input.Body;
      return new Promise((_resolve, reject) => {
        options?.abortSignal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      });
    },
  } as unknown as S3Client;
  const storage = createS3ObjectStorage(client, 'bucket', 10);
  const pending = storage.put('key', new Blob(['jpeg']).stream(), 'image/jpeg', 4);
  const rejected = expect(pending).rejects.toThrow('aborted');
  await rejected;
  expect(stream?.destroyed).toBe(true);
});
