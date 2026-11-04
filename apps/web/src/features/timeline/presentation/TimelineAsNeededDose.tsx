import type { TimelineEvent } from '@angia/contracts';

type Props = { data: Extract<TimelineEvent, { kind: 'as_needed_dose' }>['data'] };

export function TimelineAsNeededDose({ data }: Props) {
  // Lượng liều được lưu tới ba số lẻ; không làm tròn theo định dạng số đo.
  const quantity =
    data.quantity === null
      ? null
      : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(data.quantity);
  const amount = [quantity, data.unit].filter((value) => value !== null).join(' ');
  return (
    <>
      <p>{data.name}</p>
      {amount && <p>{amount}</p>}
    </>
  );
}
