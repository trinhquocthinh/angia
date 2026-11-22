import { expect, it } from 'vitest';
import { EXPORT_TABLE_QUERIES } from './exportTableQueries.js';

it('TC-823: xuất đúng cột đồng thuận và liên kết, giữ tên người trả lời', () => {
  const columns = {
    consent_invitations: [
      'id',
      'profile_id',
      'expires_at',
      'revoked_at',
      'decision',
      'respondent_name',
      'basis',
      'inviter_attested_at',
      'responded_at',
      'created_at',
    ],
    consent_legacy_attestations: ['profile_id', 'confirmed_at', 'basis'],
    profile_link_events: ['id', 'profile_id', 'action', 'actor_role', 'created_at'],
  };
  for (const [name, expected] of Object.entries(columns)) {
    const query = EXPORT_TABLE_QUERIES.find((table) => table.name === name);
    expect(query, name).toBeDefined();
    const select = query!.sql
      .split(/ FROM /i)[0]!
      .replace(/^SELECT /i, '')
      .split(',')
      .map((s) => s.trim());
    expect(select).toEqual(expected.map((column) => `t.${column}`));
    expect(query!.sql).toContain('t.profile_id = $1 AND t.family_id = $2');
    for (const forbidden of [
      't.*',
      'token_hash',
      'invited_by_account_id',
      'confirmed_by_account_id',
      'actor_account_id',
      'from_account_id',
      'to_account_id',
    ])
      expect(query!.sql).not.toContain(forbidden);
  }
});
