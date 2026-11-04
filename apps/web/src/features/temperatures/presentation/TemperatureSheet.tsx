import { useId } from 'react';
import type { RecordTemperatureRequest } from '@angia/contracts';
import { SidePanel } from '@src/shared/ui/SidePanel';
import type { TemperatureMutationResult } from '../application/useTemperatureMutation';
import { TemperatureForm } from './TemperatureForm';

type Props = {
  pending: boolean;
  error: string | null;
  onSave: (request: RecordTemperatureRequest) => Promise<TemperatureMutationResult>;
  onClose: () => void;
};
export function TemperatureSheet({ pending, error, onSave, onClose }: Props) {
  const id = useId();
  return (
    <SidePanel
      titleId={id}
      title="Ghi nhiệt độ"
      subtitle="Ghi lại giá trị và thời điểm đo."
      closeLabel="Đóng ghi nhiệt độ"
      pending={pending}
      onClose={onClose}
    >
      <TemperatureForm pending={pending} error={error} onSave={onSave} onCancel={onClose} />
    </SidePanel>
  );
}
