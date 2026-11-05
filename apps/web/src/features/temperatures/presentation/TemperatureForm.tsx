import type { RecordTemperatureRequest } from '@angia/contracts';
import { SidePanelFooter } from '@src/shared/ui/SidePanelFooter';
import type { TemperatureMutationResult } from '../application/useTemperatureMutation';
import { useTemperatureForm } from '../application/useTemperatureForm';
import { TemperatureFields } from './TemperatureFields';

type Props = {
  pending: boolean;
  error: string | null;
  onSave: (request: RecordTemperatureRequest) => Promise<TemperatureMutationResult>;
  onCancel: () => void;
};
export function TemperatureForm({ pending, error, onSave, onCancel }: Props) {
  const { form, confirmation, submit, resetConfirmation } = useTemperatureForm(pending, onSave);
  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      onChange={resetConfirmation}
      className="flex flex-1 flex-col"
    >
      <fieldset disabled={pending} className="flex min-w-0 flex-col gap-4 border-0 px-6 py-5">
        <TemperatureFields form={form} />
        {confirmation && (
          <p role="alert" className="rounded-xl bg-[#e4f0ef] p-4 text-sm text-[#131d1d]">
            Giá trị bạn nhập nằm ngoài khoảng kiểm tra nhập liệu 34,0–43,0 °C. Bạn có muốn lưu đúng giá trị
            này?
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-[#b42318]">
            {error}
          </p>
        )}
      </fieldset>
      <SidePanelFooter
        submitLabel={pending ? 'Đang lưu…' : confirmation ? 'Xác nhận lưu' : 'Lưu nhiệt độ'}
        cancelLabel={confirmation ? 'Sửa lại' : 'Hủy bỏ'}
        disabled={pending}
        submit
        cancelDisabled={pending}
        onCancel={confirmation ? resetConfirmation : onCancel}
      />
    </form>
  );
}
