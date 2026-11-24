export interface ExportAccountScope {
  id: string;
  familyId: string | null;
  familyRole: string | null;
  healthProfileId: string | null;
}
export interface ExportProfileScope {
  id: string;
  familyId: string;
  linkedToOther: boolean;
}
export function resolveExportScope(
  account: ExportAccountScope,
  requested: string | null,
  profile: ExportProfileScope | null,
): string | null | false {
  const sameFamily = account.familyId !== null && profile?.familyId === account.familyId;
  if (requested === null) {
    return sameFamily && profile.id === account.healthProfileId ? profile.id : null;
  }
  if (account.familyRole !== 'main' || !sameFamily || profile.id !== requested || profile.linkedToOther) {
    return false;
  }
  return profile.id;
}
