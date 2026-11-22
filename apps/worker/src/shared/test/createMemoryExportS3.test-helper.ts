import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  UploadPartCommand,
  type S3Client,
} from '@aws-sdk/client-s3';

export function createMemoryExportS3() {
  const objects = new Map<string, Uint8Array>();
  const parts: Uint8Array[] = [];
  const events: string[] = [];
  const state = { fail: '', creates: 0, aborts: 0 };
  const client = {
    send: async (command: unknown) => {
      const name = (command as object).constructor.name;
      events.push(name);
      if (state.fail === name) throw new Error('storage_failure');
      if (command instanceof CreateMultipartUploadCommand) {
        state.creates++;
        parts.length = 0;
        return { UploadId: 'upload' };
      }
      if (command instanceof UploadPartCommand) {
        parts.push(Uint8Array.from(command.input.Body as Uint8Array));
        return { ETag: `part-${parts.length}` };
      }
      if (command instanceof CompleteMultipartUploadCommand) {
        objects.set(command.input.Key!, Buffer.concat(parts));
        return {};
      }
      if (command instanceof AbortMultipartUploadCommand) {
        state.aborts++;
        return {};
      }
      if (command instanceof GetObjectCommand) {
        const bytes = objects.get(command.input.Key!);
        if (!bytes) throw new Error('missing_image');
        return {
          Body: (async function* () {
            for (let offset = 0; offset < bytes.length; offset += 65536)
              yield bytes.subarray(offset, offset + 65536);
          })(),
        };
      }
      throw new Error('unsupported_command');
    },
  } as unknown as S3Client;
  return { client, objects, parts, events, state };
}
