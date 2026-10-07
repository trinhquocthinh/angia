export function ProfileIdentityFields({ errors }: { errors: { displayName?: string; birthYear?: string } }) {
  return (
    <>
      <div>
        <label htmlFor="profile-name" className="text-sm font-semibold">
          Tên thân mật <span aria-hidden="true">*</span>
        </label>
        <input
          id="profile-name"
          name="displayName"
          maxLength={60}
          required
          autoComplete="off"
          className="mt-2 block min-h-12 w-full rounded-xl bg-[#eaf6f5] p-3 text-sm text-[#131d1d] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby={errors.displayName ? 'name-error' : undefined}
          placeholder="Ví dụ: Mẹ, Ba, Bé An"
        />
        {errors.displayName && (
          <p id="name-error" className="mt-2 text-sm text-[#b42318]">
            {errors.displayName}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="profile-year" className="text-sm font-semibold">
          Năm sinh (tùy chọn)
        </label>
        <input
          id="profile-year"
          name="birthYear"
          type="text"
          inputMode="numeric"
          className="mt-2 block min-h-12 w-full rounded-xl bg-[#eaf6f5] p-3 text-sm text-[#131d1d] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
          aria-invalid={Boolean(errors.birthYear)}
          aria-describedby={errors.birthYear ? 'year-error' : undefined}
          placeholder="Ví dụ: 1954"
        />
        {errors.birthYear && (
          <p id="year-error" className="mt-2 text-sm text-[#b42318]">
            {errors.birthYear}
          </p>
        )}
      </div>
    </>
  );
}
