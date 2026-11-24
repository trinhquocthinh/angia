import type { S3Client } from '@aws-sdk/client-s3';
import { Zip, ZipDeflate, ZipPassThrough } from 'fflate';
import type { DataExportDependencies } from '../application/ports.js';
import { createMultipartSink } from './createMultipartSink.js';

export function createExportArchive(client: S3Client, bucket: string): DataExportDependencies['archive'] {
  return {
    write: async (key, entries) => {
      const sink = await createMultipartSink(client, bucket, key);
      const chunks: Uint8Array[] = [];
      let zipError: Error | null = null;
      const zip = new Zip((error, data) => {
        if (error) zipError = error;
        else chunks.push(data);
      });
      const drain = async () => {
        if (zipError) throw zipError;
        for (const chunk of chunks) await sink.append(chunk);
        chunks.length = 0;
      };
      try {
        for await (const entry of entries) {
          const file = entry.compress ? new ZipDeflate(entry.name) : new ZipPassThrough(entry.name);
          zip.add(file);
          for await (const chunk of entry.chunks) {
            file.push(chunk, false);
            await drain();
          }
          file.push(new Uint8Array(), true);
          await drain();
        }
        zip.end();
        await drain();
        await sink.complete();
      } catch (error) {
        zip.terminate();
        await sink.abort().catch(() => undefined);
        throw error;
      }
    },
  };
}
