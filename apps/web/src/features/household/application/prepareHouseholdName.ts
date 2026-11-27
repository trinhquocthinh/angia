export function prepareHouseholdName(
  value: string,
  invitationToken?: string,
): { name: string; invitationToken?: string } | { error: string } {
  const name = value.trim();
  if (!name) return { error: 'Vui lòng nhập tên nhà.' };
  if (name.length > 60) return { error: 'Tên nhà không quá 60 ký tự.' };
  return { name, ...(invitationToken ? { invitationToken } : {}) };
}
