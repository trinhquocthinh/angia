import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import * as schemas from './schemas.js';
import { forbiddenWords } from './forbiddenWords.js';

const opening = { region: 'knee', side: 'left', firstEntry: { level: 6 } };
const exercise = {
  name: 'Duỗi gối',
  source: 'prescribed',
  startDate: '2026-11-05',
};

function inspectResponse(node: unknown, path: string[] = []): void {
  if (node === null || typeof node !== 'object') return;
  const value = node as Record<string, unknown>;
  if (value.properties) {
    expect(value.additionalProperties).toBe(false);
    for (const [key, child] of Object.entries(value.properties)) {
      expect(key).not.toMatch(/^(trend|severity|color|label)$|^improv|^worse/i);
      if (key === 'status') {
        const fields = value.properties as Record<string, unknown>;
        expect(
          ('region' in fields && 'side' in fields) || ('courseId' in fields && 'startDate' in fields),
        ).toBe(true);
      }
      inspectResponse(child, [...path, key]);
    }
  }
  for (const [key, child] of Object.entries(value)) {
    if (key !== 'properties') inspectResponse(child, [...path, key]);
  }
}

describe('Hợp đồng sổ đau nhức', () => {
  it('TC-667: giới hạn tên và ghi chú sau trim, ghi chú rỗng thành null', () => {
    expect(
      schemas.createPainIssueRequestSchema.safeParse({
        ...opening,
        title: 'x'.repeat(60),
      }).success,
    ).toBe(true);
    expect(
      schemas.createPainIssueRequestSchema.safeParse({
        ...opening,
        title: 'x'.repeat(61),
      }).success,
    ).toBe(false);
    const entry = schemas.createPainEntryRequestSchema;
    expect(entry.parse({ level: 6, note: `  ${'x'.repeat(500)}  ` }).note).toBe('x'.repeat(500));
    expect(entry.safeParse({ level: 6, note: ` ${'x'.repeat(501)} ` }).success).toBe(false);
    expect(entry.parse({ level: 6, note: '   ' }).note).toBeNull();
    expect(entry.parse({ level: 6 })).not.toHaveProperty('note');
    expect(schemas.updatePainEntryRequestSchema.parse({ note: '  ' })).toEqual({
      note: null,
    });
  });
  it('TC-673: duyệt schema phản hồi, chỉ có dữ liệu và mọi object đều strict', () => {
    for (const schema of [
      schemas.painIssueListSchema,
      schemas.painIssueDetailSchema,
      schemas.painContextSchema,
    ]) {
      inspectResponse(z.toJSONSchema(schema));
    }
    for (const key of ['trend', 'severity', 'color', 'label', 'improvement', 'worse', 'status']) {
      expect(schemas.painEntrySchema.safeParse({ ...validEntry, [key]: 'x' }).success).toBe(false);
    }
  });
  it('TC-694: bắt buộc thông tin bài tập và kiểm tra ngày kết thúc', () => {
    for (const key of ['name', 'source', 'startDate']) {
      const body: Record<string, unknown> = { ...exercise };
      delete body[key];
      expect(schemas.createExerciseNoteRequestSchema.safeParse(body).success).toBe(false);
    }
    for (const extra of [
      { name: '' },
      { name: 'x'.repeat(101) },
      { endDate: '2026-11-04' },
      { startDate: '2026-02-30' },
    ]) {
      expect(
        schemas.createExerciseNoteRequestSchema.safeParse({
          ...exercise,
          ...extra,
        }).success,
      ).toBe(false);
    }
    expect(
      schemas.createExerciseNoteRequestSchema.safeParse({
        ...exercise,
        endDate: exercise.startDate,
      }).success,
    ).toBe(true);
  });
  it('SPEC-052/054: mức là số nguyên 1–10, thời điểm có múi giờ', () => {
    for (const level of [0, 11, 5.5, '6']) {
      expect(schemas.createPainEntryRequestSchema.safeParse({ level }).success).toBe(false);
    }
    for (const level of [1, 10])
      expect(schemas.createPainEntryRequestSchema.safeParse({ level }).success).toBe(true);
    for (const recordedAt of ['2026-11-05T14:00:00+07:00', '2026-11-05T07:00:00Z']) {
      expect(schemas.createPainEntryRequestSchema.safeParse({ level: 6, recordedAt }).success).toBe(true);
    }
    expect(
      schemas.createPainEntryRequestSchema.safeParse({
        level: 6,
        recordedAt: '2026-11-05',
      }).success,
    ).toBe(false);
  });
  it('SPEC-052/054/055/056: từ chối trường ngoài hợp đồng ở mọi body ghi', () => {
    const bodies: [z.ZodType, object][] = [
      [schemas.createPainIssueRequestSchema, opening],
      [schemas.updatePainIssueRequestSchema, { title: 'Tên' }],
      [schemas.createPainEntryRequestSchema, { level: 6 }],
      [schemas.updatePainEntryRequestSchema, { level: 6 }],
      [schemas.resolvePainIssueRequestSchema, { resolvedOn: '2026-11-05' }],
      [schemas.reopenPainIssueRequestSchema, {}],
      [schemas.deletePainIssueRequestSchema, { confirm: true }],
      [schemas.createExerciseNoteRequestSchema, exercise],
      [schemas.updateExerciseNoteRequestSchema, { name: 'Tên' }],
    ];
    for (const [schema, body] of bodies) {
      expect(schema.safeParse(body).success).toBe(true);
      for (const key of ['createdBy', 'updatedBy', 'healthProfileId', 'status']) {
        expect(schema.safeParse({ ...body, [key]: 'x' }).success).toBe(false);
      }
    }
    expect(
      schemas.createPainIssueRequestSchema.safeParse({
        ...opening,
        firstEntry: { level: 6, createdBy: 'x' },
      }).success,
    ).toBe(false);
  });
  it('SPEC-055: PATCH kiểm cặp vùng khi đủ hai trường, xóa cần confirm true', () => {
    expect(
      schemas.updatePainIssueRequestSchema.safeParse({
        region: 'neck',
        side: 'left',
      }).success,
    ).toBe(false);
    expect(schemas.updatePainIssueRequestSchema.safeParse({ region: 'neck' }).success).toBe(true);
    for (const body of [{}, { confirm: false }])
      expect(schemas.deletePainIssueRequestSchema.safeParse(body).success).toBe(false);
  });
  it('SPEC-056: giới hạn chuỗi và nguồn bài tập tự ghi', () => {
    expect(
      schemas.createExerciseNoteRequestSchema.safeParse({
        ...exercise,
        source: 'self',
        prescriber: 'BS. An',
      }).success,
    ).toBe(false);
    for (const extra of [{ prescriber: 'x'.repeat(101) }, { note: 'x'.repeat(1001) }]) {
      expect(
        schemas.createExerciseNoteRequestSchema.safeParse({
          ...exercise,
          ...extra,
        }).success,
      ).toBe(false);
    }
    expect(
      schemas.createExerciseNoteRequestSchema.safeParse({
        ...exercise,
        prescriber: 'x'.repeat(100),
        note: 'x'.repeat(1000),
      }).success,
    ).toBe(true);
    expect(schemas.updateExerciseNoteRequestSchema.safeParse({ source: 'self' }).success).toBe(true);
    expect(
      schemas.updateExerciseNoteRequestSchema.safeParse({
        startDate: '2026-11-05',
        endDate: '2026-11-04',
      }).success,
    ).toBe(false);
  });
  it('SPEC-053: khoảng context tối đa 366 ngày và bộ lọc trạng thái', () => {
    expect(schemas.painContextQuerySchema.parse({})).toEqual({});
    expect(
      schemas.painContextQuerySchema.safeParse({
        from: '2026-01-01',
        to: '2027-01-01',
      }).success,
    ).toBe(true);
    for (const body of [
      { from: '2026-01-01', to: '2027-01-02' },
      { from: '2026-01-02', to: '2026-01-01' },
    ]) {
      expect(schemas.painContextQuerySchema.safeParse(body).success).toBe(false);
    }
    expect(schemas.painIssueQuerySchema.parse({})).toEqual({ status: 'all' });
    expect(schemas.painIssueQuerySchema.safeParse({ status: 'foo' }).success).toBe(false);
  });
  it('SPEC-053: phản hồi chấp nhận người ghi đã xóa, chặn khóa thừa lồng nhau', () => {
    const summary = {
      id,
      region: 'knee',
      side: 'left',
      title: null,
      status: 'tracking',
      resolvedOn: null,
      lastEntry: { level: 6, recordedAt: at },
      entryCount: 1,
      exerciseCount: 0,
      createdBy: null,
      updatedBy: null,
      updatedAt: at,
    };
    const detail = {
      ...summary,
      entries: [validEntry],
      exercises: [],
      statusEvents: [],
    };
    expect(schemas.painIssueDetailSchema.safeParse(detail).success).toBe(true);
    expect(schemas.painIssueListSchema.safeParse({ issues: [summary] }).success).toBe(true);
    expect(
      schemas.painIssueDetailSchema.safeParse({
        ...detail,
        entries: [{ ...validEntry, trend: 'x' }],
      }).success,
    ).toBe(false);
    expect(
      schemas.painContextSchema.safeParse({
        from: '2026-11-01',
        to: '2026-11-05',
        courses: [],
        asNeededDoses: [],
      }).success,
    ).toBe(true);
  });
  it('BR-063: danh sách từ cấm dùng chung có các từ được đặc tả nêu', () => {
    expect(forbiddenWords).toEqual(
      expect.arrayContaining(['đỡ', 'nặng', 'nhẹ', 'cải thiện', 'xấu đi', 'tốt', 'nguy hiểm', 'tiến triển']),
    );
    expect(new Set(forbiddenWords).size).toBe(forbiddenWords.length);
  });
});
const id = '0190a000-0000-7000-8000-000000000001';
const at = '2026-11-05T07:00:00Z';
const validEntry = {
  id,
  level: 6,
  recordedAt: at,
  note: null,
  createdBy: null,
  updatedBy: null,
  updatedAt: at,
};
