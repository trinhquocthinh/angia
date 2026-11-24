import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from './runMigrations.js';

describe('runMigrations với owner không có CREATEROLE', () => {
  let db: TestDatabase;
  let owner: pg.Client;
  let ownerUrl: string;

  beforeAll(async () => {
    db = await startTestDatabase();
    const admin = new pg.Client({ connectionString: db.ownerUrl });
    await admin.connect();
    try {
      // Bootstrap superuser chỉ provisioning; owner riêng chạy migration như SIT/Prod.
      await admin.query(`
        CREATE ROLE angia_nocr LOGIN PASSWORD 'angia_nocr' NOSUPERUSER NOCREATEROLE NOBYPASSRLS;
        CREATE ROLE angia_nocr_app LOGIN PASSWORD 'angia_nocr_app' NOBYPASSRLS;
        CREATE ROLE angia_nocr_family_deletion NOLOGIN NOBYPASSRLS;
        GRANT angia_nocr_family_deletion TO angia_nocr
          WITH ADMIN TRUE, INHERIT FALSE, SET FALSE;
        CREATE ROLE angia_nocr_data_export NOLOGIN NOBYPASSRLS;
        GRANT angia_nocr_data_export TO angia_nocr
          WITH ADMIN TRUE, INHERIT FALSE, SET FALSE;
      `);
      await admin.query('CREATE DATABASE angia_nocr OWNER angia_nocr');
      await admin.query('GRANT CONNECT ON DATABASE angia_nocr TO angia_nocr_app');
    } finally {
      await admin.end();
    }
    const url = new URL(db.ownerUrl);
    url.username = 'angia_nocr';
    url.password = 'angia_nocr';
    url.pathname = '/angia_nocr';
    ownerUrl = url.toString();
    owner = new pg.Client({ connectionString: ownerUrl });
    await owner.connect();
    // Cùng quyền runtime với startTestDatabase, áp dụng cho owner và DB mới.
    await owner.query(`
      GRANT USAGE ON SCHEMA public TO angia_nocr_app;
      ALTER DEFAULT PRIVILEGES FOR ROLE angia_nocr IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO angia_nocr_app;
      ALTER DEFAULT PRIVILEGES FOR ROLE angia_nocr IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO angia_nocr_app;
    `);
  });

  afterAll(async () => {
    await owner?.end();
    await db?.container.stop();
  });

  it('áp dụng migration khi owner không có CREATEROLE và giữ role job tạo sẵn NOLOGIN NOBYPASSRLS', async () => {
    const privileges = await owner.query(`
      SELECT rolsuper, rolcreaterole, rolbypassrls FROM pg_roles WHERE rolname = current_user
    `);
    expect(privileges.rows).toEqual([{ rolsuper: false, rolcreaterole: false, rolbypassrls: false }]);
    const membership = await owner.query(`
      SELECT m.admin_option, m.inherit_option, m.set_option FROM pg_auth_members m
      JOIN pg_roles job ON job.oid = m.roleid
      JOIN pg_roles owner ON owner.oid = m.member
      WHERE job.rolname IN ('angia_nocr_family_deletion', 'angia_nocr_data_export')
        AND owner.rolname = current_user
    `);
    expect(membership.rows).toEqual([
      { admin_option: true, inherit_option: false, set_option: false },
      { admin_option: true, inherit_option: false, set_option: false },
    ]);

    expect(await runMigrations(ownerUrl)).toBeGreaterThan(0);
    expect(await runMigrations(ownerUrl)).toBe(0);

    const jobRole = await owner.query(`
      SELECT rolcanlogin, rolsuper, rolbypassrls FROM pg_roles
      WHERE rolname IN ('angia_nocr_family_deletion', 'angia_nocr_data_export')
    `);
    expect(jobRole.rows).toEqual([
      { rolcanlogin: false, rolsuper: false, rolbypassrls: false },
      { rolcanlogin: false, rolsuper: false, rolbypassrls: false },
    ]);
  });
});
