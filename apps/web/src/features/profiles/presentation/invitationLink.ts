export function invitationLink(origin: string, token: string): string {
  return `${origin}/consent-invite#token=${token}`;
}
