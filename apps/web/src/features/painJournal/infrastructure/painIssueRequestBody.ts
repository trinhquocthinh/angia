import type { CreatePainIssueRequest } from '@angia/contracts';
export function painIssueRequestBody(body: CreatePainIssueRequest) {
  return {
    region: body.region,
    side: body.side,
    ...(body.title === undefined ? {} : { title: body.title }),
    firstEntry: {
      level: body.firstEntry.level,
      ...(body.firstEntry.recordedAt === undefined ? {} : { recordedAt: body.firstEntry.recordedAt }),
      ...(body.firstEntry.note == null ? {} : { note: body.firstEntry.note }),
    },
  };
}
