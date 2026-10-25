import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FamilyCapRow } from './FamilyCapRow';

describe('TC-309 — trần chi phí OCR theo gia đình ở /admin (SPEC-031)', () => {
  it('mỗi gia đình hiện đã dùng / trần USD và nhãn mặc định', () => {
    const html = renderToStaticMarkup(
      <FamilyCapRow
        cap={{
          familyId: 'f',
          familyName: 'Nhà A',
          month: '2026-10',
          capUsd: 0.5,
          capIsDefault: true,
          spentUsd: 0.21,
        }}
        pending={false}
        onSave={() => undefined}
      />,
    );
    expect(html).toContain('Nhà A');
    expect(html).toContain('$0,21 / $0,50');
    expect(html).toContain('mặc định');
    expect(html).toContain('Dùng mặc định');
  });
});
