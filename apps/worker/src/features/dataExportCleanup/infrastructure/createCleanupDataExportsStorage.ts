import { DeleteObjectCommand, ListObjectsV2Command, type S3Client } from '@aws-sdk/client-s3';
import type { CleanupDataExportsDependencies } from '../application/ports.js';

export function createCleanupDataExportsStorage(
  client: S3Client,
  bucket: string,
): CleanupDataExportsDependencies['storage'] {
  return {
    async *list() {
      let token: string | undefined;
      do {
        const page = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: 'exports/',
            ...(token ? { ContinuationToken: token } : {}),
          }),
        );
        for (const object of page.Contents ?? []) if (object.Key) yield object.Key;
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
        if (page.IsTruncated && !token) throw new Error('data_export_list_token_missing');
      } while (token);
    },
    delete: async (key) => {
      try {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      } catch (error) {
        if (!(error instanceof Error && error.name === 'NoSuchKey')) throw error;
      }
    },
  };
}
