import type { Database } from '@src/shared/db/createDatabase.js';
import { findProfileConsent } from '@src/features/profiles/infrastructure/findProfileConsent.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { DocumentEntryRepository } from '../application/documentEntryPorts.js';
import { listEntryHeads } from './listEntryHeads.js';
import { loadEntryRecords } from './loadEntryRecords.js';

// RLS qua withFamilyScope; điều kiện family_id bổ sung phòng thủ theo chiều sâu.
export function createDocumentEntryRepository(db: Database): DocumentEntryRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) =>
        work({
          profileConsent: (profileId) => findProfileConsent(tx, familyId, profileId),
          listEntryHeads: (profileId, query) => listEntryHeads(tx, familyId, profileId, query),
          loadEntryRecords: (profileId, heads) => loadEntryRecords(tx, familyId, profileId, heads),
        }),
      ),
  };
}
