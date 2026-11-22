import type { DataExportDependencies, ExportAccount, ExportEntry, ExportSession } from './ports.js';

export async function* exportEntries(
  deps: DataExportDependencies,
  session: ExportSession,
  account: ExportAccount,
  profileId: string | null,
): AsyncIterable<ExportEntry> {
  yield { name: 'account.json', compress: true, chunks: accountChunks(account) };
  if (!profileId || !account.familyId) return;
  const familyId = account.familyId;
  yield {
    name: `profile-${profileId}.json`,
    compress: true,
    chunks: session.profileChunks(familyId, profileId),
  };
  for await (const image of session.images(familyId, profileId)) {
    const prefix = `families/${familyId}/profiles/${profileId}/documents/${image.id}/`;
    if (!image.key.startsWith(prefix)) throw new Error('export_image_key_invalid');
    yield {
      name: `images/${profileId}/${image.id}.jpg`,
      compress: false,
      chunks: deps.images.read(image.key),
    };
  }
}
async function* accountChunks(account: ExportAccount): AsyncIterable<Uint8Array> {
  yield new TextEncoder().encode(JSON.stringify(account.data));
}
