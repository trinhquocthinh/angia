import type { UseFormReturn } from 'react-hook-form';
import { HouseholdNameField } from './HouseholdNameField';
import { HouseholdNameSuggestions } from './HouseholdNameSuggestions';
import { HouseholdRoleNotice } from './HouseholdRoleNotice';
export function HouseholdCreationFields({
  form,
  disabled,
}: {
  form: UseFormReturn<{ name: string }>;
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <HouseholdNameField form={form} />
      <HouseholdNameSuggestions form={form} />
      <HouseholdRoleNotice />
    </fieldset>
  );
}
