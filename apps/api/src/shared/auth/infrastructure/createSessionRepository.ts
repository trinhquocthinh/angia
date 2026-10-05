import type { Database } from '@src/shared/db/createDatabase.js';
import { sessions } from '@src/shared/db/schema/index.js';
import type { SessionRepository } from '../application/ports.js';

export function createSessionRepository(db: Database): SessionRepository {
  return {
    async create(session) {
      const [row] = await db.insert(sessions).values(session).returning({ id: sessions.id });
      if (!row) {
        throw new Error('INSERT sessions không trả về dòng nào');
      }
      return row;
    },
  };
}
