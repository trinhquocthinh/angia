import { describe, expect, it, vi } from 'vitest';
import { requestDataExport } from './requestDataExport.js';
import { getDataExport } from './getDataExport.js';
import { openDataExport } from './openDataExport.js';
import type {
  DataExportDependencies,
  DataExportRepository,
  ExportRecord,
  RequestExportInput,
} from './ports.js';

type ExportRequestSession = Parameters<Parameters<DataExportRepository['withRequest']>[1]>[0];

const id = '00000000-0000-4000-8000-000000000001';
const now = new Date('2026-11-22T12:00:00Z');
const input: RequestExportInput = { accountId: id, familyId: null, role: null, profileId: null };
function fixture(count = 0) {
  const session: ExportRequestSession = {
    rateLimit: {
      now: () => now.getTime(),
      keyHasher: (kind, key) => `${kind}:${String(key)}`,
      store: { read: vi.fn(async () => count), increment: vi.fn(async () => count + 1) },
    },
    profileAllowed: vi.fn(async () => true),
    enqueue: vi.fn(async () => id),
  };
  const record: ExportRecord = {
    id,
    status: 'ready',
    objectKey: `exports/${id}.zip`,
    expiresAt: new Date(now.getTime() + 1),
    createdAt: now,
  };
  const deps: DataExportDependencies = {
    repository: { withRequest: async (_, work) => work(session), find: vi.fn(async () => record) },
    now: () => now,
    reader: {
      get: vi.fn(async () => ({
        body: new ReadableStream<Uint8Array>({
          start(c) {
            c.enqueue(new Uint8Array([80, 75, 3, 4]));
            c.close();
          },
        }),
        contentType: 'application/zip',
      })),
    },
  };
  return { deps, session, record };
}

describe('SPEC-072 tải dữ liệu', () => {
  it('TC-823 cho phép self không có nhà và chỉ ghi lượt khi đã xếp việc', async () => {
    const { deps, session } = fixture();
    expect(await requestDataExport(deps.repository, input)).toEqual({ ok: true, exportId: id });
    expect(session.rateLimit.store.increment).toHaveBeenCalledOnce();
  });
  it('TC-826 lần thứ tư bị chặn trước khi kiểm hồ sơ', async () => {
    const { deps, session } = fixture(3);
    expect(await requestDataExport(deps.repository, { ...input, profileId: id })).toMatchObject({
      ok: false,
      code: 'ERR_RATE_LIMITED',
      retryAfterSeconds: 43200,
    });
    expect(session.profileAllowed).not.toHaveBeenCalled();
    expect(session.rateLimit.store.increment).not.toHaveBeenCalled();
  });
  it.each(['member', null] as const)('TC-826 vai trò %s không được xuất profileId', async (role) => {
    const { deps, session } = fixture();
    expect(await requestDataExport(deps.repository, { ...input, familyId: id, role, profileId: id })).toEqual(
      { ok: false, code: 'ERR_NOT_FOUND' },
    );
    expect(session.rateLimit.store.increment).not.toHaveBeenCalled();
  });
  it('TC-826 chủ hộ chỉ xuất được hồ sơ hợp lệ và 404 không tốn lượt', async () => {
    const { deps, session } = fixture();
    const scoped = { ...input, familyId: id, role: 'main' as const, profileId: id };
    vi.mocked(session.profileAllowed).mockResolvedValueOnce(false);
    expect(await requestDataExport(deps.repository, scoped)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(session.rateLimit.store.increment).not.toHaveBeenCalled();
    expect(await requestDataExport(deps.repository, scoped)).toEqual({ ok: true, exportId: id });
  });
  it('TC-825 sẵn sàng còn hạn trả trạng thái; đúng thời điểm hết hạn trả null', async () => {
    const { deps, record } = fixture();
    expect(await getDataExport(deps, id, id)).toEqual(record);
    record.expiresAt = now;
    expect(await getDataExport(deps, id, id)).toBeNull();
  });
  it.each(['pending', 'failed'] as const)(
    'TC-825 trạng thái %s không có hạn vẫn đọc được',
    async (status) => {
      const { deps, record } = fixture();
      record.status = status;
      record.expiresAt = null;
      expect(await getDataExport(deps, id, id)).toEqual(record);
      expect(await openDataExport(deps, id, id)).toBeNull();
    },
  );
  it('TC-826 tên tệp lấy ngày theo giờ Việt Nam, không theo UTC', async () => {
    const { deps } = fixture();
    const createdAt = new Date('2026-11-21T18:30:00Z');
    const found = (await deps.repository.find(id, id))!;
    deps.repository.find = async () => ({ ...found, createdAt });
    expect((await openDataExport(deps, id, id))?.filename).toBe('angia-du-lieu-20261122.zip');
  });
  it('TC-826 stream đúng byte và tên tệp theo ngày tạo yêu cầu', async () => {
    const { deps } = fixture();
    const result = await openDataExport(deps, id, id);
    expect(result?.filename).toBe('angia-du-lieu-20261122.zip');
    expect(new Uint8Array(await new Response(result!.body).arrayBuffer())).toEqual(
      new Uint8Array([80, 75, 3, 4]),
    );
  });
  it('TC-826 không mở object có key sai hoặc đã mất', async () => {
    const { deps, record } = fixture();
    record.objectKey = 'exports/other.zip';
    expect(await openDataExport(deps, id, id)).toBeNull();
    expect(deps.reader.get).not.toHaveBeenCalled();
    record.objectKey = `exports/${id}.zip`;
    vi.mocked(deps.reader.get).mockResolvedValue(null);
    expect(await openDataExport(deps, id, id)).toBeNull();
  });
});
