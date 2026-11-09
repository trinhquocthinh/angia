import type { S3Client } from '@aws-sdk/client-s3';
import { expect, it } from 'vitest';
import { checkHealth } from '../application/checkHealth.js';
import { createS3BucketProbe } from './createS3BucketProbe.js';

it('probe S3 nhận tín hiệu hủy từ health để kết thúc request treo', async () => {
  let active = 0;
  const client = {
    send: (_command: unknown, options?: { abortSignal?: AbortSignal }) => {
      active++;
      return new Promise((_resolve, reject) => {
        options?.abortSignal?.addEventListener(
          'abort',
          () => {
            active--;
            reject(new Error('aborted'));
          },
          { once: true },
        );
      });
    },
  } as unknown as S3Client;
  const report = await checkHealth(
    { db: async () => {}, storage: createS3BucketProbe(client, 'bucket') },
    { timeoutMs: 10 },
  );
  expect(report).toEqual({ status: 'degraded', db: 'ok', storage: 'down' });
  expect(active).toBe(0);
});
