import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import {
  createInvitationRoute,
  revokeInvitationRoute,
  viewInvitationRoute,
  respondInvitationRoute,
} from './invitationRouteDefinitions.js';

// SPEC-040/005 (E14): giữ đường dẫn cũ để client còn link cũ nhận 410 rõ ràng thay vì 404. Chặn ở middleware
// nên body cũ không bị 422 che mất việc ngừng link; định nghĩa OpenAPI chỉ còn để tài liệu hóa.
export function registerInvitationRoutes(app: OpenAPIHono<AppEnv>): void {
  for (const path of [
    '/api/health-profiles/:id/consent-invitations',
    '/api/consent-invitations/view',
    '/api/consent-invitations/respond',
  ]) {
    app.use(path, async (c) => errorResponse(c, 'ERR_CONSENT_INVITATION_RETIRED'));
  }
  for (const route of [
    createInvitationRoute,
    revokeInvitationRoute,
    viewInvitationRoute,
    respondInvitationRoute,
  ]) {
    app.openAPIRegistry.registerPath(route);
  }
}
