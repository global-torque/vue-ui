import type { JSONSchemaType } from 'ajv';
import { useFormValidation } from '@global-torque/ui-kit/form-validation';

interface FixtureModel {
  name: string;
}

/** A small installed-package fixture used by the selected UI Kit consumer check. */
export function runNeutralValidationFixture() {
  const form = useFormValidation<FixtureModel>(
    {
      type: 'object',
      properties: { name: { type: 'string', minLength: 2 } },
      required: ['name'],
    } as JSONSchemaType<FixtureModel>,
    undefined,
    { name: '' },
    ['name'],
  );
  form.onValidate();
  return {
    valid: form.isValid.value,
    error: form.formErrors.getFieldError('name'),
  };
}
