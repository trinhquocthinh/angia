export function prepareInvitationCode(value: string): string | null {
  const code = value.replace(/\s/g, '').toUpperCase();
  return /^[A-F0-9]{12}$/.test(code) ? code : null;
}
