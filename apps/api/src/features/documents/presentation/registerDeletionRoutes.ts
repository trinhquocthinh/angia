import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { deleteDocument } from '../application/deleteDocument.js';
import type { DocumentDeletionDeps } from '../application/deletionPorts.js';
import type { DocumentDependencies } from '../application/ports.js';
import { getDeletionImpact } from '../application/getDeletionImpact.js';
import { deleteDocumentRoute, documentDeletionImpactRoute } from './deletionRouteDefinitions.js';

// requireMain và no-store của /api/source-documents/* đã gắn trong registerReviewRoutes.
export function registerDeletionRoutes(
  app: OpenAPIHono<AppEnv>,
  documents: DocumentDependencies,
  logger: DocumentDeletionDeps['logger'],
): void {
  const deps: DocumentDeletionDeps = { ...documents.deletion, storage: documents.storage, logger };
  app.openapi(documentDeletionImpactRoute, async (c) => {
    const familyId = c.get('session')!.family!.id;
    const result = await getDeletionImpact(deps.repository, familyId, c.req.valid('param').id);
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
  app.openapi(deleteDocumentRoute, async (c) => {
    const familyId = c.get('session')!.family!.id;
    const result = await deleteDocument(deps, familyId, c.req.valid('param').id);
    return result.ok ? c.body(null, 204) : c.json(...errorJson(result.code));
  });
}
