import type { DataExportDependencies, ExportAccount, ExportEntry, ExportSession } from './ports.js';
import { profileExportEntries } from './profileExportEntries.js';

export async function* exportEntries(
  deps: DataExportDependencies,
  session: ExportSession,
  account: ExportAccount,
  profileId: string | null,
): AsyncIterable<ExportEntry> {
  yield { name: 'account.json', compress: true, chunks: accountChunks(account) };
  const exported = new Set<string>();
  if (profileId && account.familyId) {
    yield* profileExportEntries(deps, session, account.familyId, profileId);
    exported.add(profileId);
  }
  if (session.request.profileId !== null) return;
  await session.enterRemovedWindowScope();
  try {
    for (const profile of await session.removedProfiles()) {
      if (exported.has(profile.profileId)) continue;
      yield* profileExportEntries(deps, session, profile.familyId, profile.profileId);
      exported.add(profile.profileId);
    }
  } finally {
    await session.leaveRemovedWindowScope();
  }
}
async function* accountChunks(account: ExportAccount): AsyncIterable<Uint8Array> {
  yield new TextEncoder().encode(JSON.stringify(account.data));
}
