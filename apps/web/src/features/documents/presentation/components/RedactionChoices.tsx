import type { FamilyUsage } from '@angia/contracts';
import type { UploadChoice } from '../../application/redactionConfirmDecision';
import { AiBudgetSpentNotice } from './AiBudgetSpentNotice';

type Props = {
  choice: UploadChoice | null;
  checked: boolean;
  aiExhausted: boolean;
  aiReason?: FamilyUsage['aiOcr']['reason'];
  aiBlockedReason: string | null;
  onChoice: (choice: UploadChoice) => void;
  onChecked: (checked: boolean) => void;
};

const CARD =
  'flex flex-col rounded-xl border border-transparent bg-[#eaf6f5] px-4 py-1 transition-colors has-[:checked]:border-[#286958]';
const RADIO = 'flex min-h-11 items-center gap-3 text-sm font-semibold text-[#131d1d]';

// Gửi tự động nhận diện (BR-041 cần tick xác nhận) hoặc tự nhập; hàng chờ đủ thì khóa gửi AI (BR-043).
export function RedactionChoices(props: Props) {
  const { choice, checked, aiExhausted, aiBlockedReason, onChoice, onChecked } = props;
  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg leading-6 font-semibold text-[#131d1d]">Sau khi tải lên</legend>
        <div className={`${CARD} ${aiBlockedReason ? '' : 'hover:border-[#286958]'}`}>
          <label className={`${RADIO} ${aiBlockedReason ? 'opacity-55' : ''}`}>
            <input
              type="radio"
              name="upload-choice"
              value="ai"
              checked={choice === 'ai'}
              disabled={aiBlockedReason !== null}
              onChange={() => onChoice('ai')}
              className="h-5 w-5 accent-[#286958]"
            />
            <span>{aiExhausted ? 'Xếp hàng chờ tự động nhận diện' : 'Gửi tự động nhận diện'}</span>
          </label>
          {aiBlockedReason && <p className="pb-2 text-xs leading-5 text-[#9b472c]">{aiBlockedReason}</p>}
          {aiExhausted && !aiBlockedReason && (
            <div className="pb-3 pt-1">
              <AiBudgetSpentNotice reason={props.aiReason} />
            </div>
          )}
        </div>
        <div className={`${CARD} hover:border-[#286958]`}>
          <label className={RADIO}>
            <input
              type="radio"
              name="upload-choice"
              value="manual"
              checked={choice === 'manual'}
              onChange={() => onChoice('manual')}
              className="h-5 w-5 accent-[#286958]"
            />
            <span>Tôi tự nhập</span>
          </label>
        </div>
      </fieldset>
      <label className={`flex gap-3 text-sm leading-6 text-[#131d1d] ${choice === 'ai' ? '' : 'opacity-55'}`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={choice !== 'ai'}
          onChange={(event) => onChecked(event.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-[#286958]"
        />
        Tôi đã kiểm tra, ảnh này không còn thông tin định danh
      </label>
    </>
  );
}
