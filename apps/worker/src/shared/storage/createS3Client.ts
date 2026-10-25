import { S3Client } from '@aws-sdk/client-s3';
import type { WorkerConfig } from '../config/loadWorkerConfig.js';

export function createS3Client(config: WorkerConfig): S3Client {
  return new S3Client({
    endpoint: config.S3_ENDPOINT,
    region: config.S3_REGION,
    // Garage bắt buộc path-style.
    forcePathStyle: config.S3_FORCE_PATH_STYLE,
    credentials: { accessKeyId: config.S3_ACCESS_KEY_ID, secretAccessKey: config.S3_SECRET_ACCESS_KEY },
  });
}
