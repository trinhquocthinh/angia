import type { paths } from '@src/shared/api/schema.gen';
import type { HouseholdResult } from './ports';

type Request = paths['/api/invitations/accept']['post']['requestBody']['content']['application/json'];
export type AcceptHouseholdInvitation = (body: Request, csrfToken: string) => Promise<HouseholdResult>;
