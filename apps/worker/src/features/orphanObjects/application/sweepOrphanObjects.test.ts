import { describe, expect, it } from 'vitest';
import type { OrphanRepository, OrphanStorage, StoredObject, SweepPolicy } from './ports.js';
import { sweepOrphanObjects } from './sweepOrphanObjects.js';

const NOW = new Date('2026-10-20T20:00:00Z');
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3600_000);
const OLD = hoursAgo(25);
const policy: SweepPolicy = { graceHours: 24, maxDeletes: 500, dryRun: false, now: () => NOW };
const fam = (n: number) => `0199a000-0000-7000-8000-${String(n).padStart(12, '0')}`;
const uid = (n: number) => `0199b000-0000-7000-8000-${String(n).padStart(12, '0')}`;
const doc = (f: string) => `families/${f}/profiles/${uid(90)}/documents/${uid(91)}`;
const original = (f: string) => `${doc(f)}/original.jpg`;
const preview = (f: string, n: number) => `${doc(f)}/previews/${uid(n)}.webp`;
const ocr = (f: string, n: number) => `${doc(f)}/ocr/${uid(80)}/${uid(n)}.png`;

interface Fake {
  objects: Record<string, StoredObject[]>;
  refs: Record<string, string[]>;
  failRefs?: string[];
  failDelete?: string[];
}
function createDeps(fake: Fake) {
  const deleted: string[] = [];
  const calls: string[] = [];
  const repository: OrphanRepository = {
    listFamilyIds: async () => Object.keys(fake.objects),
    referencedKeys: async (familyId) => {
      calls.push(`refs:${familyId}`);
      if (fake.failRefs?.includes(familyId)) throw new Error('db');
      return new Set(fake.refs[familyId] ?? []);
    },
  };
  const storage: OrphanStorage = {
    async *list(prefix) {
      calls.push(`list:${prefix}`);
      const familyId = prefix.split('/')[1] ?? '';
      yield* fake.objects[familyId] ?? [];
    },
    delete: async (key) => {
      if (fake.failDelete?.includes(key)) throw new Error('s3');
      deleted.push(key);
    },
  };
  return { deps: { repository, storage }, deleted, calls };
}
const stored = (key: string, lastModified: Date | null = OLD): StoredObject => ({ key, lastModified });

describe('sweepOrphanObjects (BR-044, SPEC-032)', () => {
  it('TC-314: xóa ảnh gốc, preview và PNG draft cũ không còn tham chiếu khi quá ân hạn', async () => {
    const f = fam(1);
    const keep = preview(f, 2);
    const { deps, deleted } = createDeps({
      objects: { [f]: [original(f), preview(f, 1), ocr(f, 1), keep].map((key) => stored(key)) },
      refs: { [f]: [keep] },
    });
    const result = await sweepOrphanObjects(deps, policy);
    expect(deleted.sort()).toEqual([original(f), preview(f, 1), ocr(f, 1)].sort());
    expect(result.families).toEqual([
      { familyId: f, scanned: 4, removed: 3, skipped: 0, failed: 0, outcome: 'swept' },
    ]);
    expect(result).toMatchObject({ capped: false, dryRun: false, totals: { families: 1, removed: 3 } });
  });

  it('TC-315: giữ object mồ côi còn trong ân hạn, đúng mốc cutoff hoặc thiếu LastModified', async () => {
    const f = fam(1);
    const { deps, deleted } = createDeps({
      objects: {
        [f]: [
          stored(preview(f, 1), hoursAgo(23)),
          stored(preview(f, 2), hoursAgo(24)),
          stored(ocr(f, 1), null),
        ],
      },
      refs: { [f]: [original(f)] },
    });
    await sweepOrphanObjects(deps, policy);
    expect(deleted).toEqual([]);
  });

  it('TC-316: giữ object đang được tham chiếu dù đã cũ', async () => {
    const f = fam(1);
    const { deps, deleted } = createDeps({
      objects: { [f]: [stored(original(f)), stored(preview(f, 1))] },
      refs: { [f]: [original(f), preview(f, 1)] },
    });
    await sweepOrphanObjects(deps, policy);
    expect(deleted).toEqual([]);
  });

  it('TC-317: tập tham chiếu rỗng thì bỏ qua cả gia đình', async () => {
    const [a, b] = [fam(1), fam(2)];
    const { deps, deleted } = createDeps({
      objects: {
        [a]: [stored(original(a)), stored(preview(a, 1))],
        [b]: [stored(`families/${b}/other.txt`)],
      },
      refs: {},
    });
    const result = await sweepOrphanObjects(deps, policy);
    expect(deleted).toEqual([]);
    expect(result.families[0]).toMatchObject({ familyId: a, outcome: 'empty_references', removed: 0 });
    expect(result.families[1]).toMatchObject({ familyId: b, outcome: 'swept', skipped: 1 });
  });

  it('TC-318: chạm trần thì dừng cả lần chạy', async () => {
    const [a, b, c] = [fam(1), fam(2), fam(3)];
    const fake = {
      objects: Object.fromEntries(
        [a, b, c].map((f) => [f, [stored(original(f)), stored(preview(f, 1)), stored(preview(f, 2))]]),
      ),
      refs: Object.fromEntries([a, b, c].map((f) => [f, [original(f)]])),
    };
    const capped = createDeps(fake);
    const result = await sweepOrphanObjects(capped.deps, { ...policy, maxDeletes: 3 });
    expect(capped.deleted).toHaveLength(3);
    expect(result.capped).toBe(true);
    expect(result.families.map((f) => [f.familyId, f.removed])).toEqual([
      [a, 2],
      [b, 1],
    ]);
    const exact = createDeps({ ...fake, objects: { [a]: fake.objects[a]!, [b]: fake.objects[b]! } });
    const full = await sweepOrphanObjects(exact.deps, { ...policy, maxDeletes: 4 });
    expect(exact.deleted).toHaveLength(4);
    expect(full.capped).toBe(false);
  });

  it('TC-319: dry-run không xóa nhưng đếm đúng', async () => {
    const f = fam(1);
    const { deps, deleted } = createDeps({
      objects: { [f]: [original(f), preview(f, 1), ocr(f, 1), preview(f, 2)].map((key) => stored(key)) },
      refs: { [f]: [preview(f, 2)] },
    });
    const result = await sweepOrphanObjects(deps, { ...policy, dryRun: true });
    expect(deleted).toEqual([]);
    expect(result).toMatchObject({ dryRun: true, totals: { removed: 3 } });
  });

  it('TC-320: lỗi một gia đình không chặn gia đình khác; xóa lỗi được đếm', async () => {
    const [a, b] = [fam(1), fam(2)];
    const { deps, deleted, calls } = createDeps({
      objects: {
        [a]: [stored(preview(a, 1))],
        [b]: [stored(original(b)), stored(preview(b, 1)), stored(preview(b, 2))],
      },
      refs: { [b]: [original(b)] },
      failRefs: [a],
      failDelete: [preview(b, 1)],
    });
    const result = await sweepOrphanObjects(deps, policy);
    expect(result.families[0]).toMatchObject({ familyId: a, outcome: 'error', removed: 0 });
    expect(result.families[1]).toMatchObject({ familyId: b, outcome: 'swept', removed: 1, failed: 1 });
    expect(deleted).toEqual([preview(b, 2)]);
    expect(calls.indexOf(`list:families/${b}/`)).toBeLessThan(calls.indexOf(`refs:${b}`));
  });
  it('TC-320: gia đình lỗi có reason (mã lỗi, không có khóa); lỗi liệt kê gia đình không ném', async () => {
    const f = fam(1);
    const { deps } = createDeps({ objects: { [f]: [stored(preview(f, 1))] }, refs: { [f]: [original(f)] } });
    deps.storage.list = async function* () {
      yield* [];
      throw Object.assign(new Error(`denied ${preview(f, 1)}`), { name: 'AccessDenied' });
    };
    const result = await sweepOrphanObjects(deps, policy);
    expect(result.families[0]).toMatchObject({ outcome: 'error', reason: 'AccessDenied' });
    deps.repository.listFamilyIds = async () => {
      throw Object.assign(new Error('connect'), { code: 'ECONNREFUSED' });
    };
    await expect(sweepOrphanObjects(deps, policy)).resolves.toMatchObject({
      families: [],
      listError: 'ECONNREFUSED',
    });
  });

  it('TC-318: tín hiệu hủy (job hết hạn) dừng giữa các gia đình', async () => {
    const [a, b] = [fam(1), fam(2)];
    const controller = new AbortController();
    const { deps, deleted } = createDeps({
      objects: {
        [a]: [stored(original(a)), stored(preview(a, 1))],
        [b]: [stored(original(b)), stored(preview(b, 1))],
      },
      refs: { [a]: [original(a)], [b]: [original(b)] },
    });
    const remove = deps.storage.delete;
    deps.storage.delete = async (key) => {
      await remove(key);
      controller.abort();
    };
    const result = await sweepOrphanObjects(deps, policy, controller.signal);
    expect(deleted).toEqual([preview(a, 1)]);
    expect(result).toMatchObject({ aborted: true, totals: { families: 1 } });
  });
});
