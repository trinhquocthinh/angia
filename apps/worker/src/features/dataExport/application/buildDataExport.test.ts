import { expect, it, vi } from 'vitest';
import { buildDataExport } from './buildDataExport.js';
import type { DataExportDependencies, ExportEntry, ExportSession } from './ports.js';

async function* empty() {
  /* Không có ảnh. */
}
function fixture(profileId: string | null = null) {
  const session: ExportSession = {
    request: { accountId: 'a', profileId },
    getAccount: async () => ({
      id: 'a',
      familyId: 'f',
      familyRole: 'main',
      healthProfileId: 'p',
      data: { id: 'a' },
    }),
    getProfile: async () => ({ id: 'p', familyId: 'f', linkedToOther: false }),
    profileChunks: async function* () {
      yield new TextEncoder().encode('{}');
    },
    images: empty,
    markReady: vi.fn(),
    markFailed: vi.fn(),
  };
  const files: string[] = [];
  const deps: DataExportDependencies = {
    repository: { withPending: async (_id, work) => work(session) },
    archive: {
      write: vi.fn(async (_key: string, entries: AsyncIterable<ExportEntry>) => {
        for await (const entry of entries) {
          files.push(entry.name);
          for await (const chunk of entry.chunks) expect(chunk).toBeInstanceOf(Uint8Array);
        }
      }),
    },
    images: { read: empty },
  };
  return { session, deps, files };
}
it('TC-819: pending thành ready sau khi ghi đủ các tệp', async () => {
  const { session, deps, files } = fixture();
  expect(await buildDataExport(deps, 'export')).toBe('ready');
  expect(files).toEqual(['account.json', 'profile-p.json']);
  expect(session.markReady).toHaveBeenCalledWith('exports/export.zip');
  expect(session.markFailed).not.toHaveBeenCalled();
});
it('TC-819: không pending hoặc không tồn tại thì bỏ qua', async () => {
  const { deps } = fixture();
  deps.repository.withPending = async () => 'skipped';
  expect(await buildDataExport(deps, 'export')).toBe('skipped');
  expect(deps.archive.write).not.toHaveBeenCalled();
});
it('TC-821: phạm vi sai thành failed và không ghi object', async () => {
  const { session, deps } = fixture('p');
  session.getProfile = async () => ({ id: 'p', familyId: 'f', linkedToOther: true });
  expect(await buildDataExport(deps, 'export')).toBe('failed');
  expect(session.markFailed).toHaveBeenCalledOnce();
  expect(deps.archive.write).not.toHaveBeenCalled();
});
it('TC-819: lỗi lưu trữ được ném để retry, không đổi trạng thái', async () => {
  const { session, deps } = fixture();
  deps.archive.write = async () => {
    throw new Error('S3');
  };
  await expect(buildDataExport(deps, 'export')).rejects.toThrow('S3');
  expect(session.markReady).not.toHaveBeenCalled();
  expect(session.markFailed).not.toHaveBeenCalled();
});
it('TC-819: chặn key ảnh ngoài tiền tố trước khi đọc', async () => {
  const { session, deps } = fixture();
  session.images = async function* () {
    yield { id: 'd', key: 'families/other/image.jpg' };
  };
  deps.images.read = vi.fn(empty);
  await expect(buildDataExport(deps, 'export')).rejects.toThrow('export_image_key_invalid');
  expect(deps.images.read).not.toHaveBeenCalled();
  expect(session.markReady).not.toHaveBeenCalled();
});
it('TC-819: self không nhà không tra hồ sơ và chỉ xuất tài khoản', async () => {
  const { session, deps, files } = fixture();
  session.getAccount = async () => ({
    id: 'a',
    familyId: null,
    familyRole: null,
    healthProfileId: null,
    data: { id: 'a' },
  });
  session.getProfile = vi.fn();
  expect(await buildDataExport(deps, 'export')).toBe('ready');
  expect(files).toEqual(['account.json']);
  expect(session.getProfile).not.toHaveBeenCalled();
});
it('TC-819: ảnh được ghi đúng đường dẫn tài liệu trong ZIP', async () => {
  const { session, deps, files } = fixture();
  const key = 'families/f/profiles/p/documents/d/sanitized.jpg';
  session.images = async function* () {
    yield { id: 'd', key };
  };
  deps.images.read = vi.fn(async function* () {
    yield new Uint8Array([1, 2, 3]);
  });
  expect(await buildDataExport(deps, 'export')).toBe('ready');
  expect(files).toEqual(['account.json', 'profile-p.json', 'images/p/d.jpg']);
  expect(deps.images.read).toHaveBeenCalledWith(key);
});
