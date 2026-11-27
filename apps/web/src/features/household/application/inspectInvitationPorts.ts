import type { paths } from '@src/shared/api/schema.gen';
type Operation = paths['/api/invitations/inspect']['post'];
export type InvitationInspection = Operation['responses'][200]['content']['application/json'];
export type InspectHouseholdInvitation = (body: {
  token: string;
}) => Promise<{ ok: true; data: InvitationInspection } | { ok: false; code: string }>;
