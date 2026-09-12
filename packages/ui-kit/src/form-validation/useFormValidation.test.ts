import Ajv from 'ajv';
import { nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import type { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useForm } from './useForm';
import { scrollToError, useFormValidation } from './useFormValidation';

interface ExampleForm {
  name: string;
  choice?: string;
}

const schema = (overrides: Record<string, unknown> = {}) => ({
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    choice: { type: 'string', enum: ['one', 'two'] },
  },
  required: ['name'],
  ...overrides,
} as unknown as JSONSchemaType<ExampleForm>);

describe('neutral form validation', () => {
  it('rejects product keywords with the default validator', () => {
    const frontend = schema({ properties: { name: { type: 'string', mustBeUS: true } } });
    const form = useFormValidation<ExampleForm>(frontend, undefined, { name: '' }, ['name']);

    expect(() => form.onValidate()).toThrow(/schema compilation failed/i);
    expect(frontend).toEqual(schema({ properties: { name: { type: 'string', mustBeUS: true } } }));
  });

  it('cleans up a failed schema compile before a retry', () => {
    const frontend = schema({
      $id: 'https://example.test/forms/invalid',
      properties: { name: { type: 'string', unknownKeyword: true } },
    });
    const form = useFormValidation<ExampleForm>(frontend, undefined, { name: '' }, ['name']);

    expect(() => form.onValidate()).toThrow(/schema compilation failed.*unknownKeyword/i);
    expect(() => form.onValidate()).toThrow(/schema compilation failed.*unknownKeyword/i);
  });

  it('uses an isolated host validator and receives a cloned model', () => {
    const createAjv = vi.fn(() => {
      const validator = new Ajv({ allErrors: true });
      validator.addKeyword({ keyword: 'hostRule', validate: () => true });
      return validator;
    });
    let prepared: Record<string, unknown> | undefined;
    const model = { name: 'ok' };
    const form = useFormValidation<ExampleForm>(
      schema({ properties: { name: { type: 'string', hostRule: true } } }),
      undefined,
      model,
      ['name'],
      {
        createAjv,
        prepareData: (value) => {
          prepared = value as Record<string, unknown>;
          prepared.name = 'prepared';
          return prepared;
        },
      },
    );

    form.onValidate();
    expect(createAjv).toHaveBeenCalledTimes(1);
    expect(prepared).not.toBe(model);
    expect(model.name).toBe('ok');
  });

  it('reuses a compiled schema and replaces a reactive schema with the same id', async () => {
    const currentSchema = ref(schema({
      $id: 'https://example.test/forms/example',
      properties: { name: { type: 'string', minLength: 3 } },
    }));
    const form = useFormValidation(currentSchema, undefined, { name: 'ok' }, ['name']);

    expect(() => {
      form.onValidate();
      form.onValidate();
    }).not.toThrow();
    expect(form.formErrors.hasErrors.value).toBe(true);

    currentSchema.value = schema({
      $id: 'https://example.test/forms/example',
      properties: { name: { type: 'string', minLength: 1 } },
    });
    await nextTick();
    expect(form.formErrors.hasErrors.value).toBe(false);
    expect(() => form.onValidate()).not.toThrow();
    expect(form.formErrors.hasErrors.value).toBe(false);
  });

  it('composes cloned schemas with frontend precedence and preserves requirements', () => {
    const frontend = schema({
      properties: { name: { type: 'string', enum: ['frontend'] } },
      required: ['name'],
    });
    const backend = schema({
      properties: { name: { type: 'string', enum: ['backend'] } },
      required: ['choice'],
    });
    const form = useFormValidation(frontend, backend, { name: '' }, ['name']);

    expect(form.schemaObject.value.properties.name).toMatchObject({ enum: ['frontend'] });
    expect(form.schemaObject.value.required).toEqual(['name']);
    expect(frontend.properties.name).toEqual({ type: 'string', enum: ['frontend'] });
    expect(backend.properties.name).toEqual({ type: 'string', enum: ['backend'] });
  });

  it('clears validation on reset and schema replacement', async () => {
    const currentSchema = ref(schema());
    const form = useFormValidation(currentSchema, undefined, { name: '' }, ['name']);

    form.onValidate();
    expect(form.formErrors.hasErrors.value).toBe(true);
    form.resetValidation();
    expect(form.formErrors.hasErrors.value).toBe(false);
    expect(form.validation.value).toBeUndefined();

    form.onValidate();
    currentSchema.value = schema({ properties: { name: { type: 'string', minLength: 1 } } });
    await nextTick();
    expect(form.formErrors.hasErrors.value).toBe(false);
    expect(form.validation.value).toBeUndefined();
  });

  it('tracks dirty state with normalized snapshots', () => {
    const current = ref({ name: '' });
    const form = useForm({
      initialValues: { name: undefined } as { name?: string },
      currentValues: current,
    });

    expect(form.isDirty.value).toBe(false);
    current.value.name = 'changed';
    expect(form.isDirty.value).toBe(true);
    form.reset();
    expect(form.isDirty.value).toBe(false);
  });

  it('keeps the scroll helper safe when no document exists', () => {
    vi.stubGlobal('document', undefined);
    expect(() => scrollToError('form')).not.toThrow();
    vi.unstubAllGlobals();
  });
});
