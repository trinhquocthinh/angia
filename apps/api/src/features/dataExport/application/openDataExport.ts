import { getDataExport } from './getDataExport.js';
import type { DataExportDependencies } from './ports.js';

export async function openDataExport(deps: DataExportDependencies, accountId: string, id: string) {
  const row = await getDataExport(deps, accountId, id);
  if (!row || row.status !== 'ready' || row.objectKey !== `exports/${id}.zip`) return null;
  const object = await deps.reader.get(row.objectKey);
  if (!object) return null;
  // sv-SE cho dạng yyyy-mm-dd; ngày theo giờ Việt Nam để yêu cầu lúc 0–7 giờ sáng không lùi một ngày.
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(row.createdAt);
  const date = day.replaceAll('-', '');
  return { body: object.body, filename: `angia-du-lieu-${date}.zip` };
}
