import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ReviewRequestError } from '@src/features/documents/application/ReviewRequestError';
import type { ApproveDocumentRequest } from '@src/features/documents/application/reviewPorts';
import { useCourseConflictPrompt } from './useCourseConflictPrompt';

it('giữ nguyên bản đã gửi khi bên gọi sửa đối tượng lệnh sau submit', () => {
  const request: Extract<ApproveDocumentRequest, { type: 'prescription' }> = {
    type: 'prescription',
    data: {
      type: 'prescription',
      issuedDate: '2026-10-01',
      facility: 'BV Trước',
      diagnosis: null,
      items: [
        {
          name: 'A',
          strength: null,
          quantityPerDose: 1,
          externalUse: false,
          doseUnit: null,
          slots: ['morning'],
          durationDays: 30,
          longTerm: false,
          note: null,
          totalQuantity: null,
        },
      ],
    },
  };
  const error = new ReviewRequestError('Xung đột', 409, 'ERR_COURSE_CONFLICT_UNRESOLVED', [], [], null, [
    {
      itemIndexes: [0],
      nameNormalized: 'a',
      courses: [
        {
          id: 'old',
          name: 'A',
          strength: null,
          quantityPerDose: 1,
          doseUnit: null,
          slots: ['morning'],
          startDate: '2026-09-01',
          endDate: null,
        },
      ],
    },
  ]);
  let submitted = false;
  function Probe() {
    const state = useCourseConflictPrompt(() => undefined, error);
    if (!submitted) {
      submitted = true;
      state.submit(request);
      request.data.facility = 'BV Sau';
    }
    return <span>{state.prompt?.request.data.facility}</span>;
  }
  expect(renderToStaticMarkup(<Probe />)).toBe('<span>BV Trước</span>');
});
