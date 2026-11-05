import { showsVitals } from '@angia/contracts';
import { readBirthYear } from '../../application/readBirthYear';
type Props = {
  birthYear: string;
  vitalsEnabled: boolean;
  currentYear: number;
  yearError: string | null;
  onBirthYearChange: (value: string) => void;
  onVitalsChange: (value: boolean) => void;
};
export function EditProfileFields({
  birthYear,
  vitalsEnabled,
  currentYear,
  yearError,
  onBirthYearChange,
  onVitalsChange,
}: Props) {
  const year = readBirthYear(birthYear, currentYear);
  const child = year !== null && !showsVitals({ birthYear: year, vitalsEnabled: null }, currentYear);
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="edit-profile-year" className="text-sm font-semibold">
          Năm sinh <span aria-hidden="true">*</span>
        </label>
        <input
          id="edit-profile-year"
          name="birthYear"
          type="text"
          inputMode="numeric"
          required
          autoFocus
          value={birthYear}
          onChange={(event) => onBirthYearChange(event.currentTarget.value)}
          aria-invalid={Boolean(yearError)}
          aria-describedby={yearError ? 'edit-year-error' : undefined}
          className="mt-2 block min-h-12 w-full rounded-xl bg-[#eaf6f5] p-3 text-sm"
        />
        {yearError && (
          <p id="edit-year-error" role="alert" className="mt-2 text-sm text-[#b42318]">
            {yearError}
          </p>
        )}
      </div>
      {child && (
        <div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              role="switch"
              checked={vitalsEnabled}
              aria-describedby="edit-vitals-help"
              onChange={(event) => onVitalsChange(event.currentTarget.checked)}
              className="h-5 w-5 accent-[#004135]"
            />
            Theo dõi huyết áp, đường huyết
          </label>
          <p id="edit-vitals-help" className="mt-1 text-sm text-[#55615f]">
            Bật khi bác sĩ yêu cầu theo dõi cho bé.
          </p>
        </div>
      )}
    </div>
  );
}
