import { registerPrivacyHeaders } from '@src/features/documentPrivacy/presentation/registerPrivacyHeaders.js';
import type { PrivacyDependencies } from '@src/features/documentPrivacy/application/ports.js';
import { registerPrivacyRoutes } from '@src/features/documentPrivacy/presentation/registerPrivacyRoutes.js';
import {
  registerInvitationRoutes,
  type InvitationRouteDependencies,
} from '@src/features/consentInvitations/presentation/registerInvitationRoutes.js';
import type { DocumentDependencies } from '@src/features/documents/application/ports.js';
import { registerDocumentRoutes } from '@src/features/documents/presentation/registerDocumentRoutes.js';
import { registerManualRecordRoutes } from '@src/features/documents/presentation/registerManualRecordRoutes.js';
import {
  registerReviewRoutes,
  type ReviewDependencies,
} from '@src/features/documents/presentation/registerReviewRoutes.js';
import type { MeasurementRepository } from '@src/features/measurements/application/ports.js';
import { registerMeasurementRoutes } from '@src/features/measurements/presentation/registerMeasurementRoutes.js';
import type { ProfileRepository } from '@src/features/profiles/application/ports.js';
import { registerProfileRoutes } from '@src/features/profiles/presentation/registerProfileRoutes.js';
import { OpenAPIHono } from '@hono/zod-openapi';
import { except } from 'hono/combine';
import type { FamilyAdminRepository } from '@src/features/family/application/ports.js';
import { registerAdminRoutes } from '@src/features/family/presentation/registerAdminRoutes.js';
import type { HealthProbes } from '@src/features/health/application/ports.js';
import { registerHealthRoute } from '@src/features/health/presentation/registerHealthRoute.js';
import { loadSession } from '@src/shared/auth/presentation/loadSession.js';
import { type AuthRouteDeps, registerAuthRoutes } from '@src/shared/auth/presentation/registerAuthRoutes.js';
import { registerMeRoute } from '@src/shared/auth/presentation/registerMeRoute.js';
import { requireSession } from '@src/shared/auth/presentation/requireSession.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';

export type AppDependencies = {
  healthProbes: HealthProbes;
  auth: AuthRouteDeps;
  familyAdmin: FamilyAdminRepository;
  profiles: ProfileRepository;
  consentInvitations: InvitationRouteDependencies;
  documents: DocumentDependencies;
  review: ReviewDependencies;
  privacy: PrivacyDependencies;
  measurements: MeasurementRepository;
};

// Ngoại lệ duy nhất của "mọi route /api cần phiên" (Tech Spec §4); logout vẫn cần phiên + CSRF.
const PUBLIC_PATHS = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/callback',
  '/api/consent-invitations/view',
  '/api/consent-invitations/respond',
];

// Lắp ráp route từ các adapter đã khởi tạo; tách khỏi server.ts để test in-process qua app.request().
export function createApp(deps: AppDependencies): OpenAPIHono<AppEnv> {
  // Body/params sai Zod schema → 422 ERR_VALIDATION theo cấu trúc lỗi chuẩn (SDD §4.2).
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => (result.success ? undefined : errorResponse(c, 'ERR_VALIDATION')),
  });
  const cookies = { secret: deps.auth.cookieSecret, secure: deps.auth.secureCookies };
  app.onError((error, c) => {
    deps.auth.logger.error({ reason: error.name }, 'Lỗi chưa xử lý');
    return errorResponse(c, 'ERR_INTERNAL');
  });
  registerPrivacyHeaders(app);
  app.use(
    '/api/*',
    except(
      ['/api/consent-invitations/view', '/api/consent-invitations/respond'],
      loadSession(deps.auth.login, cookies),
    ),
  );
  app.use('/api/*', except(PUBLIC_PATHS, requireSession()));
  registerHealthRoute(app, deps.healthProbes);
  registerAuthRoutes(app, deps.auth);
  registerMeRoute(app);
  registerAdminRoutes(app, deps.familyAdmin);
  registerProfileRoutes(app, deps.profiles, deps.auth.login.now);
  registerDocumentRoutes(app, deps.documents);
  registerReviewRoutes(app, deps.review);
  registerManualRecordRoutes(app, deps.review.repository);
  registerPrivacyRoutes(app, deps.privacy);
  registerMeasurementRoutes(app, deps.measurements);
  registerInvitationRoutes(app, deps.consentInvitations);
  return app;
}
