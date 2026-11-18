import { useWatch, type UseFormReturn } from 'react-hook-form';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
export function HouseholdNameField({ form }: { form: UseFormReturn<{ name: string }> }) {
  const name = useWatch({ control: form.control, name: 'name' });
  const fieldError = form.formState.errors.name?.message;
  return (
    <div className="household-name-field">
      <div className="household-name-label">
        <label htmlFor="household-name">Tên nhà</label>
        <span>{name.trim().length}/60 ký tự</span>
      </div>
      <div className="household-name-input">
        <span className="household-name-home">
          <AdminIcon name="home_health" size={22} />
        </span>
        <input
          id="household-name"
          {...form.register('name')}
          placeholder="Ví dụ: Nhà Lan"
          maxLength={60}
          autoComplete="off"
          aria-invalid={Boolean(fieldError)}
          aria-describedby={`household-name-help${fieldError ? ' household-name-error' : ''}`}
        />
        <span className="household-name-edit">
          <AdminIcon name="edit" size={20} />
        </span>
        {name && (
          <button
            type="button"
            className="household-name-clear"
            aria-label="Xóa tên nhà"
            onClick={() => {
              form.setValue('name', '', { shouldDirty: true });
              form.setFocus('name');
            }}
          >
            <AdminIcon name="close" />
          </button>
        )}
      </div>
      <p id="household-name-help" className="household-start-note">
        <AdminIcon name="info" size={15} />
        Từ 1 đến 60 ký tự. Tên này sẽ hiển thị trong nhà của bạn.
      </p>
      {fieldError && (
        <p id="household-name-error" role="alert" className="text-danger">
          {fieldError}
        </p>
      )}
    </div>
  );
}
