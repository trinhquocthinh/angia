import type { OpenAPIHono } from '@hono/zod-openapi';
import { extractionPayloadSchema } from '@angia/contracts';
import { requireMain } from '@src/shared/auth/presentation/requireMain.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { toMeasurementResponse } from '@src/features/measurements/presentation/toMeasurementResponse.js';
import { approveDocument } from '../application/approveDocument.js';
import { getDocumentReview } from '../application/getDocumentReview.js';
import { listDocuments } from '../application/listDocuments.js';
import { openDocumentImage } from '../application/openDocumentImage.js';
import type { ObjectReader, ReviewRepository } from '../application/reviewPorts.js';
import {
  approveDocumentRoute,
  documentImageRoute,
  documentReviewRoute,
  listDocumentsRoute,
} from './reviewRouteDefinitions.js';
import { toSourceDocumentResponse } from './toSourceDocumentResponse.js';

export interface ReviewDependencies {
  repository: ReviewRepository;
  reader: ObjectReader;
}

const familyOf = (c: { get(key: 'session'): AppEnv['Variables']['session'] }) => c.get('session')!.family!.id;

export function registerReviewRoutes(app: OpenAPIHono<AppEnv>, deps: ReviewDependencies): void {
  app.use('/api/source-documents', requireMain());
  app.use('/api/source-documents/*', requireMain());
  app.use('/api/source-documents*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.openapi(listDocumentsRoute, async (c) => {
    const documents = await listDocuments(deps.repository, familyOf(c), c.req.valid('query'));
    return c.json(documents.map(toSourceDocumentResponse), 200);
  });
  app.openapi(documentReviewRoute, async (c) => {
    const result = await getDocumentReview(deps.repository, familyOf(c), c.req.valid('param').id);
    if (!result.ok) return c.json(...errorJson(result.code));
    const extraction = extractionPayloadSchema.safeParse(result.value.extraction);
    const document = toSourceDocumentResponse(result.value.document);
    return c.json({ document, extraction: extraction.success ? extraction.data : null }, 200);
  });
  app.openapi(documentImageRoute, async (c) => {
    const result = await openDocumentImage(deps.repository, deps.reader, {
      familyId: familyOf(c),
      documentId: c.req.valid('param').id,
      variant: c.req.valid('query').variant,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    c.header('Content-Type', result.value.contentType);
    c.header('X-Content-Type-Options', 'nosniff');
    return c.body(result.value.body, 200);
  });
  app.openapi(approveDocumentRoute, async (c) => {
    const body = c.req.valid('json');
    const result = await approveDocument(deps.repository, {
      ...body,
      familyId: familyOf(c),
      documentId: c.req.valid('param').id,
    });
    if (result.ok) {
      const { document, measurements } = result.value;
      const response = {
        document: toSourceDocumentResponse(document),
        measurements: measurements.map(toMeasurementResponse),
      };
      return c.json(response, 200);
    }
    if (result.code === 'ERR_OUT_OF_RANGE_UNCONFIRMED')
      return c.json(...errorJson(result.code, { fields: result.fields }));
    return c.json(...errorJson(result.code));
  });
}
