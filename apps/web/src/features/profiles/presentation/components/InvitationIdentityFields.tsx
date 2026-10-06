import { InvitationBasisOption } from './InvitationBasisOption';
import { InvitationIcon } from './InvitationIcon';
type Props = {
  name: string;
  basis: 'self' | 'guardian' | null;
  setName: (name: string) => void;
  setBasis: (basis: 'self' | 'guardian') => void;
  errors: { respondentName?: string; basis?: string };
};
export function InvitationIdentityFields({ name, basis, setName, setBasis, errors }: Props) {
  return (
    <>
      <div>
        <label
          htmlFor="respondent-name"
          className="flex items-center justify-between gap-2 text-[13px] font-medium"
        >
          Tên của bạn<span className="text-[11px] font-normal text-[#286958]">Tự khai</span>
        </label>
        <div className="relative mt-2">
          <input
            id="respondent-name"
            maxLength={60}
            autoComplete="name"
            value={name}
            placeholder="Nhập họ và tên của bạn…"
            onChange={(event) => setName(event.currentTarget.value)}
            aria-invalid={Boolean(errors.respondentName)}
            aria-describedby={errors.respondentName ? 'respondent-error' : undefined}
            className="block min-h-[52px] w-full rounded-xl bg-[#eaf6f5] py-3 pl-4 pr-11 text-sm outline-offset-2 placeholder:text-[#707975] focus:outline-[#286958]"
          />
          <span className="pointer-events-none absolute right-3 top-4 text-[#286958]">
            <InvitationIcon name="edit" />
          </span>
        </div>
        {errors.respondentName && (
          <p id="respondent-error" className="mt-2 text-sm text-[#b42318]">
            {errors.respondentName}
          </p>
        )}
      </div>
      <fieldset className="mt-5 space-y-2.5" aria-describedby={errors.basis ? 'basis-error' : undefined}>
        <legend className="mb-3 text-[13px] font-medium">Tư cách của bạn</legend>
        <InvitationBasisOption value="self" selected={basis === 'self'} onChange={() => setBasis('self')} />
        <InvitationBasisOption
          value="guardian"
          selected={basis === 'guardian'}
          onChange={() => setBasis('guardian')}
        />
        {errors.basis && (
          <p id="basis-error" className="text-sm text-[#b42318]">
            {errors.basis}
          </p>
        )}
      </fieldset>
    </>
  );
}
