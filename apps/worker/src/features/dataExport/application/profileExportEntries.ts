import type { DataExportDependencies, ExportEntry, ExportSession } from './ports.js';

export async function* profileExportEntries(
  deps: DataExportDependencies,
  session: ExportSession,
  familyId: string,
  profileId: string,
): AsyncIterable<ExportEntry> {
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
