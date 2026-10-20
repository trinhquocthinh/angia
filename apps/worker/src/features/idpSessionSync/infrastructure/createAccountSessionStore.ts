import type pg from 'pg';
import type { AccountSessionStore } from '../application/ports.js';

// accounts/sessions không áp RLS (như createSessionRepository của API) nên chạy thẳng trên pool role app.
export function createAccountSessionStore(pool: pg.Pool): AccountSessionStore {
  return {
    async listAccounts(now) {
      const result = await pool.query<{
        id: string;
        oidc_subject: string;
        is_system_admin: boolean;
        has_session: boolean;
      }>(
        `SELECT a.id, a.oidc_subject, a.is_system_admin,
           EXISTS (SELECT 1 FROM sessions s WHERE s.account_id = a.id AND s.expires_at > $1) AS has_session
         FROM accounts a ORDER BY a.id`,
        [now],
      );
      return result.rows.map((row) => ({
        id: row.id,
        oidcSubject: row.oidc_subject,
        isSystemAdmin: row.is_system_admin,
        hasSession: row.has_session,
      }));
    },

    // Thu hồi phiên và đổi cờ admin trong một transaction: lỗi giữa chừng không để lại trạng thái nửa vời.
    async apply(change) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM sessions WHERE account_id = ANY($1::uuid[])', [change.revoke]);
        await client.query('UPDATE accounts SET is_system_admin = true WHERE id = ANY($1::uuid[])', [
          change.adminOn,
        ]);
        await client.query('UPDATE accounts SET is_system_admin = false WHERE id = ANY($1::uuid[])', [
          change.adminOff,
        ]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
