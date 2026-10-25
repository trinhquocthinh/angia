import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import pg from 'pg';

const POSTGRES_IMAGE = 'postgres:16-alpine';
const OWNER_ROLE = 'angia_test';
const APP_ROLE = 'angia_test_app';
const APP_PASSWORD = 'angia_test_app';

export interface TestDatabase {
  container: StartedPostgreSqlContainer;
  ownerUrl: string;
  appUrl: string;
}

// Dựng PostgreSQL rỗng với 2 role giống SIT/dev: owner chạy migration, app NOBYPASSRLS cho runtime.
export async function startTestDatabase(): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE)
    .withDatabase('angia_test')
    .withUsername(OWNER_ROLE)
    .withPassword(OWNER_ROLE)
    .start();
  const ownerUrl = container.getConnectionUri();
  await createAppRole(ownerUrl);
  const appUrl = new URL(ownerUrl);
  appUrl.username = APP_ROLE;
  appUrl.password = APP_PASSWORD;
  return { container, ownerUrl, appUrl: appUrl.toString() };
}

// Cùng quyền với docker/dev/postgres-initdb/01-app-role.sh.
async function createAppRole(ownerUrl: string): Promise<void> {
  const client = new pg.Client({ connectionString: ownerUrl });
  await client.connect();
  try {
    await client.query(`
      CREATE ROLE ${APP_ROLE} LOGIN PASSWORD '${APP_PASSWORD}' NOBYPASSRLS;
      GRANT CONNECT ON DATABASE angia_test TO ${APP_ROLE};
      GRANT USAGE ON SCHEMA public TO ${APP_ROLE};
      ALTER DEFAULT PRIVILEGES FOR ROLE ${OWNER_ROLE} IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_ROLE};
      ALTER DEFAULT PRIVILEGES FOR ROLE ${OWNER_ROLE} IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO ${APP_ROLE};
    `);
  } finally {
    await client.end();
  }
}
