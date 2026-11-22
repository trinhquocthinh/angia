import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  type S3Client,
  type CompletedPart,
} from '@aws-sdk/client-s3';

const PART_SIZE = 8 * 1024 * 1024;

// Chờ từng UploadPart trước khi nhận thêm dữ liệu: không tích lũy promise/chunk theo kích thước ZIP.
export async function createMultipartSink(client: S3Client, bucket: string, key: string) {
  const { UploadId } = await client.send(
    new CreateMultipartUploadCommand({ Bucket: bucket, Key: key, ContentType: 'application/zip' }),
  );
  if (!UploadId) throw new Error('export_upload_id_missing');
  const input = { Bucket: bucket, Key: key, UploadId };
  const parts: CompletedPart[] = [];
  let buffer = Buffer.allocUnsafe(PART_SIZE);
  let length = 0;
  const upload = async () => {
    if (parts.length >= 10000) throw new Error('export_too_many_parts');
    const PartNumber = parts.length + 1;
    const { ETag } = await client.send(
      new UploadPartCommand({ ...input, PartNumber, Body: buffer.subarray(0, length) }),
    );
    if (!ETag) throw new Error('export_part_etag_missing');
    parts.push({ PartNumber, ETag });
    buffer = Buffer.allocUnsafe(PART_SIZE);
    length = 0;
  };
  return {
    append: async (chunk: Uint8Array) => {
      let offset = 0;
      while (offset < chunk.length) {
        const size = Math.min(PART_SIZE - length, chunk.length - offset);
        buffer.set(chunk.subarray(offset, offset + size), length);
        offset += size;
        length += size;
        if (length === PART_SIZE) await upload();
      }
    },
    complete: async () => {
      if (length) await upload();
      await client.send(new CompleteMultipartUploadCommand({ ...input, MultipartUpload: { Parts: parts } }));
    },
    abort: async () => {
      await client.send(new AbortMultipartUploadCommand(input));
    },
  };
}
