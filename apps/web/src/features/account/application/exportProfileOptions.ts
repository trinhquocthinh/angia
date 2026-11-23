import type { DataExportScope, ExportableProfile } from '@src/features/account/application/ports';

export type ExportProfileOption = {
  value: string;
  label: string;
};

export function buildExportProfileOptions(
  profiles: readonly ExportableProfile[],
  isOwner: boolean,
): ExportProfileOption[] {
  if (!isOwner) return [];
  const unlinked = profiles
    .filter((profile) => !profile.hasLinkedAccount)
    .map((profile) => ({ value: profile.id, label: profile.displayName }));
  return [{ value: 'self', label: 'Dữ liệu của tôi' }, ...unlinked];
}

export function resolveExportScope(selected: string): DataExportScope {
  return selected === 'self' ? 'self' : { profileId: selected };
}
