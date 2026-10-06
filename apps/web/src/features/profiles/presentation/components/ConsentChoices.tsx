export function ConsentChoices({
  basis,
  pending,
  setBasis,
}: {
  basis: 'self' | 'guardian' | null;
  pending: boolean;
  setBasis: (basis: 'self' | 'guardian') => void;
}) {
  return (
    <fieldset disabled={pending} className="mt-6 space-y-4">
      <legend className="mb-4 text-sm font-semibold">Căn cứ đồng thuận</legend>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="radio"
          name="consent-basis"
          value="self"
          checked={basis === 'self'}
          onChange={() => setBasis('self')}
        />
        Đối tượng của hồ sơ đã đồng thuận
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="radio"
          name="consent-basis"
          value="guardian"
          checked={basis === 'guardian'}
          onChange={() => setBasis('guardian')}
        />
        Người giám hộ hợp pháp đã đồng thuận
      </label>
    </fieldset>
  );
}
