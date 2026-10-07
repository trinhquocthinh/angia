import { InvitationIcon } from './InvitationIcon';
export function InvitationBasisOption({
  value,
  selected,
  onChange,
}: {
  value: 'self' | 'guardian';
  selected: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex min-h-[76px] cursor-pointer items-center gap-3 rounded-xl p-3.5 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#286958] ${selected ? 'bg-[#aef0da]/40' : 'bg-[#eaf6f5] hover:bg-[#e4f0f0]'}`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-[#286958] text-white' : 'bg-[#deebea] text-[#404945]'}`}
      >
        <InvitationIcon name={value === 'self' ? 'person' : 'guardian'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-5 text-[#004135]">
          {value === 'self' ? 'Tôi là người có hồ sơ' : 'Tôi là người giám hộ hợp pháp'}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#404945]">
          {value === 'self'
            ? 'Trực tiếp quyết định chia sẻ dữ liệu cá nhân'
            : 'Theo tư cách giám hộ hợp pháp của bạn'}
        </span>
      </span>
      <input
        name="respondent-basis"
        value={value}
        type="radio"
        checked={selected}
        onChange={onChange}
        className="h-5 w-5 shrink-0 accent-[#004135]"
      />
    </label>
  );
}
