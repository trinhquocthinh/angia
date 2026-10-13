import { useState } from 'react';
import type { Prescription } from '@angia/contracts';
import {
  initialReuseForm,
  reuseDateBounds,
  toReuseRequest,
  validateReuseForm,
} from '../../application/reuseForm';
import type { useReusePrescription } from '../../application/useReusePrescription';
import { ReuseConflictNotice } from './ReuseConflictNotice';
import { ReuseFormFooter } from './ReuseFormFooter';
import { ReuseItemRow } from './ReuseItemRow';
import { ReuseStartDateField } from './ReuseStartDateField';

type Props = { prescription: Prescription; today: string; state: ReturnType<typeof useReusePrescription> };

// Form Dùng lại: ngày bắt đầu (sau ngày kê, ≤ hôm nay + 30), mọi dòng chọn sẵn; khóa khi đang lưu/đối soát.
export function ReusePrescriptionForm({ prescription, today, state }: Props) {
  const [form, setForm] = useState(() => initialReuseForm(prescription, today));
  const [touched, setTouched] = useState(false);
  const bounds = reuseDateBounds(prescription.issuedDate, today);
  const formError = validateReuseForm(form, prescription.issuedDate, today);
  const locked = state.pending || Boolean(state.prompt);
  const message = touched && formError ? formError : state.prompt ? null : state.error?.message;
  return (
    <form
      noValidate
      className="flex flex-col gap-4 px-6 py-5"
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (!formError) void state.submit(toReuseRequest(form));
      }}
    >
      <ReuseStartDateField
        {...bounds}
        value={form.startDate}
        disabled={locked}
        onChange={(startDate) => setForm({ ...form, startDate })}
      />
      {prescription.items.map((item, index) => (
        <ReuseItemRow
          key={item.id}
          index={index}
          item={item}
          value={form.items[index]!}
          disabled={locked}
          onChange={(value) =>
            setForm({ ...form, items: form.items.map((current, i) => (i === index ? value : current)) })
          }
        />
      ))}
      {state.prompt && (
        <ReuseConflictNotice
          key={JSON.stringify(state.prompt)}
          prescription={prescription}
          {...state.prompt}
          pending={state.pending}
          onSubmit={(request) => void state.submit(request)}
          onCancel={state.reset}
        />
      )}
      <ReuseFormFooter
        message={message ?? null}
        showSubmit={!state.prompt}
        pending={state.pending}
        canSubmit={form.items.some((item) => item.selected)}
      />
    </form>
  );
}
