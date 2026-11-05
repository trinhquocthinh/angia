import { HeadBucketCommand, type S3Client } from '@aws-sdk/client-s3';
import type { DependencyProbe } from '../application/ports.js';

export function createS3BucketProbe(client: S3Client, bucket: string): DependencyProbe {
  return async (signal) => {
    await client.send(new HeadBucketCommand({ Bucket: bucket }), signal ? { abortSignal: signal } : {});
  };
}
