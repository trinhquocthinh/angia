import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';

const execute = promisify(execFile);
const script = fileURLToPath(new URL('../../../../scripts/ops/rlsInventory.ts', import.meta.url));

interface Inventory {
  format: string;
  context: { read_only: string }[];
  roles: { name: string; superuser: boolean; bypass_rls: boolean }[];
  relations: { schema: string; name: string; rls: boolean }[];
  policies: { schema: string; relation: string }[];
}

describe('E27-S1-T2: kiểm kê quyền và theo dõi đường ngoài RLS', () => {
  let db: TestDatabase;
  let owner: pg.Client;
  let app: pg.Client;

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    owner = new pg.Client({ connectionString: db.ownerUrl });
    app = new pg.Client({ connectionString: db.appUrl });
    await owner.connect();
    await app.connect();
  });

  afterAll(async () => {
    try {
      await app?.end();
    } finally {
      try {
        await owner?.end();
      } finally {
        await db?.container.stop();
      }
    }
  });

  const inventory = async (): Promise<Inventory> => {
    const { stdout } = await execute(process.execPath, ['--import', 'tsx', script], {
      env: { ...process.env, DATABASE_OWNER_URL: db.ownerUrl },
      timeout: 30_000,
      maxBuffer: 5 * 1024 * 1024,
    });
    return JSON.parse(stdout) as Inventory;
  };

  it('role runtime thực tế không phải superuser và không BYPASSRLS', async () => {
    const result = await app.query(`
      SELECT rolsuper, rolbypassrls
      FROM pg_roles WHERE rolname = current_user
    `);
    expect(result.rows).toEqual([{ rolsuper: false, rolbypassrls: false }]);
  });

  it('CLI xuất JSON từ transaction chỉ đọc và kiểm kê RLS hiện có', async () => {
    const report = await inventory();
    expect(report.format).toBe('angia-rls-inventory/1');
    expect(report.context).toEqual([expect.objectContaining({ read_only: 'on' })]);
    expect(report.roles).toContainEqual(
      expect.objectContaining({
        name: 'angia_test_app',
        superuser: false,
        bypass_rls: false,
      }),
    );
    expect(report.relations).toContainEqual(
      expect.objectContaining({
        schema: 'public',
        name: 'health_profiles',
        rls: true,
      }),
    );
    expect(report.policies).toContainEqual(
      expect.objectContaining({
        schema: 'public',
        relation: 'health_profiles',
      }),
    );
  });

  it('kiểm kê phản ánh việc nới BYPASSRLS và trạng thái sau khôi phục', async () => {
    const assertRuntimeRole = async () => {
      const report = await inventory();
      expect(report.roles.find(({ name }) => name === 'angia_test_app')).toMatchObject({
        superuser: false,
        bypass_rls: false,
      });
    };

    await assertRuntimeRole();
    try {
      await owner.query('ALTER ROLE angia_test_app BYPASSRLS');
      await expect(assertRuntimeRole()).rejects.toThrow();
    } finally {
      await owner.query('ALTER ROLE angia_test_app NOBYPASSRLS');
    }
    await assertRuntimeRole();
  });

  // Chuyển thành test thực thi khi đường tương ứng được triển khai.
  // TODO không phải bằng chứng TC đạt và không thay phép phá thử quyền tối thiểu.
  it.todo('TC-868: E27-S3-T2/T3 — chỉ trả trường tối thiểu; cấp SELECT toàn bảng làm cùng assertion đỏ');
  it.todo(
    'TC-869: E28-S2-T2 — chỉ đọc/xoá nhà có yêu cầu pending đến hạn; bỏ điều kiện làm cùng assertion đỏ',
  );
  it.todo(
    'TC-870: E29-S3-T1/T2 — chỉ đọc đúng hồ sơ trong cửa sổ; mở hồ sơ hoặc bỏ hạn làm cùng assertion đỏ',
  );
});
