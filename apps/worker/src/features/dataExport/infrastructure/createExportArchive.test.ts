import { randomBytes } from 'node:crypto';
import { unzipSync, strFromU8 } from 'fflate';
import { expect, it } from 'vitest';
import { createMemoryExportS3 } from '@src/shared/test/createMemoryExportS3.test-helper.js';
import { createExportArchive } from './createExportArchive.js';
import { createExportImageReader } from './createExportImageReader.js';

it('TC-819: ZIP streaming có JSON nén và ảnh nguyên vẹn, part 8 MiB', async () => {
  const s3 = createMemoryExportS3();
  const image = randomBytes(9 * 1024 * 1024);
  s3.objects.set('image', image);
  const images = createExportImageReader(s3.client, 'bucket');
  const archive = createExportArchive(s3.client, 'bucket');
  await archive.write(
    'exports/test.zip',
    (async function* () {
      yield {
        name: 'account.json',
        compress: true,
        chunks: (async function* () {
          yield Buffer.from('{"id":"a"}');
        })(),
      };
      for (let index = 0; index < 3; index++)
        yield { name: `images/${index}.jpg`, compress: false, chunks: images.read('image') };
    })(),
  );
  const zip = unzipSync(s3.objects.get('exports/test.zip')!);
  expect(strFromU8(zip['account.json']!)).toBe('{"id":"a"}');
  expect(Buffer.from(zip['images/2.jpg']!).equals(image)).toBe(true);
  expect(s3.parts.length).toBeGreaterThan(3);
  for (const part of s3.parts.slice(0, -1)) expect(part.length).toBe(8 * 1024 * 1024);
  expect(s3.state.aborts).toBe(0);
});
it.each(['UploadPartCommand', 'CompleteMultipartUploadCommand', 'GetObjectCommand'])(
  'TC-819: lỗi %s hủy multipart và ném lỗi retry',
  async (failure) => {
    const s3 = createMemoryExportS3();
    s3.objects.set('image', new Uint8Array(100));
    s3.state.fail = failure;
    const archive = createExportArchive(s3.client, 'bucket');
    await expect(
      archive.write(
        'export',
        (async function* () {
          yield {
            name: 'image.jpg',
            compress: false,
            chunks: createExportImageReader(s3.client, 'bucket').read('image'),
          };
        })(),
      ),
    ).rejects.toThrow('storage_failure');
    expect(s3.state.aborts).toBe(1);
    expect(s3.objects.has('export')).toBe(false);
  },
);
it('TC-819: ảnh vượt 10 MiB bị chặn và hủy multipart', async () => {
  const s3 = createMemoryExportS3();
  s3.objects.set('image', new Uint8Array(10 * 1024 * 1024 + 1));
  await expect(
    createExportArchive(s3.client, 'bucket').write(
      'export',
      (async function* () {
        yield {
          name: 'image.jpg',
          compress: false,
          chunks: createExportImageReader(s3.client, 'bucket').read('image'),
        };
      })(),
    ),
  ).rejects.toThrow('export_image_too_large');
  expect(s3.state.aborts).toBe(1);
});
