import type { DataExportDependencies, ExportRecord } from './ports.js';

export async function getDataExport(
  deps: Pick<DataExportDependencies, 'repository' | 'now'>,
  accountId: string,
  id: string,
): Promise<ExportRecord | null> {
  const row = await deps.repository.find(accountId, id);
  if (!row || (row.status === 'ready' && (!row.expiresAt || row.expiresAt <= deps.now()))) return null;
  return row;
}
