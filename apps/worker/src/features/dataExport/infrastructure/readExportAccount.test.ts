import type pg from 'pg';
import { expect, it, vi } from 'vitest';
import { exportEntries } from '../application/exportEntries.js';
import type { DataExportDependencies, ExportSession } from '../application/ports.js';
import { readExportAccount } from './readExportAccount.js';

it('TC-819: account.json không chứa family_id nhưng giữ familyId cho logic phạm vi', async () => {
  const query = vi
    .fn()
    .mockResolvedValueOnce({
      rows: [
        {
          id: 'a',
          family_id: 'f',
          family_role: 'main',
          health_profile_id: null,
          display_name: 'Lan',
        },
      ],
    })
    .mockResolvedValueOnce({ rows: [{ id: 'acceptance' }] });
  const account = await readExportAccount({ query } as unknown as pg.PoolClient, 'a');
  expect(account.familyId).toBe('f');
  const entries = exportEntries(
    {} as DataExportDependencies,
    { request: { profileId: 'p' } } as ExportSession,
    account,
    null,
  );
  const entry = (await entries[Symbol.asyncIterator]().next()).value!;
  expect(entry.name).toBe('account.json');
  let json = '';
  for await (const chunk of entry.chunks) json += new TextDecoder().decode(chunk);
  expect(JSON.parse(json)).not.toHaveProperty('family_id');
  expect(JSON.parse(json)).toMatchObject({
    id: 'a',
    display_name: 'Lan',
    legal_acceptances: [{ id: 'acceptance' }],
  });
});
