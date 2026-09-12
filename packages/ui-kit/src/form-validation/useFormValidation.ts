import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  computed,
  reactive,
  ref,
  unref,
  watch,
  type ComputedRef,
  type MaybeRef,
  type Reactive,
  type Ref,
} from 'vue';
import type { ErrorObject } from 'ajv';
import type { JSONSchemaType } from 'ajv/dist/types/json-schema';
import type { FormValidationOptions } from './types';
import { useFormErrors } from './useFormErrors';

export type { ErrorSchema, FormValidationOptions } from './types';

export interface FormValidationReturn<T extends object> {
  model: Reactive<T>;
  validation: Ref<unknown>;
  isValid: ComputedRef<boolean>;
  onValidate: () => void;
  schemaObject: Ref<JSONSchemaType<T>>;
  resetValidation: () => void;
  formErrors: ReturnType<typeof useFormErrors>;
  isFieldRequired: (fieldPath: string) => boolean;
  getErrorText: (fieldPath: string, errorData?: MaybeRef<unknown>) => string[];
  scrollToError: (parentClass: string) => void;
  getOptions: (fieldPath: string) => { value: string; name: string }[];
}

type Schema = Record<string, unknown>;

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as T;
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, item]) => { result[key] = cloneValue(item); });
    return result as T;
  }
  return value;
}

function mergeSchema(base: Schema, override: Schema): Schema {
  const result = cloneValue(base);
  Object.entries(override).forEach(([key, value]) => {
    const current = result[key];
    if (current && value && !Array.isArray(current) && !Array.isArray(value)
      && typeof current === 'object' && typeof value === 'object') {
      result[key] = mergeSchema(current as Schema, value as Schema);
    } else {
      result[key] = cloneValue(value);
    }
  });
  return result;
}

function createDefaultAjv() {
  const validator = new Ajv({ allErrors: true, allowMatchingProperties: true });
  addFormats(validator);
  return validator;
}

function resolveRef(node: unknown, root: Schema): Schema | null {
  if (!node || typeof node !== 'object') return null;
  const ref = (node as Schema).$ref;
  if (typeof ref !== 'string') return node as Schema;
  if (ref === '#') return root;
  if (!ref.startsWith('#/')) return node as Schema;
  let current: unknown = root;
  for (const segment of ref.slice(2).split('/').map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))) {
    if (!current || typeof current !== 'object' || !(segment in current)) return node as Schema;
    current = (current as Schema)[segment];
  }
  return current && typeof current === 'object' ? current as Schema : null;
}

function schemaAtPath(path: string, root: Schema): Schema | null {
  let current = resolveRef(root, root);
  for (const part of path.split('.')) {
    if (!current) return null;
    if (/^\d+$/.test(part)) {
      current = resolveRef(current.items, root);
      continue;
    }
    if (current.type === 'array') current = resolveRef(current.items, root);
    const properties = current?.properties;
    const child = properties && typeof properties === 'object'
      ? (properties as Record<string, unknown>)[part]
      : undefined;
    current = current ? resolveRef(child, root) : null;
  }
  return current;
}

function valueAtPath(data: unknown, fieldPath: string): unknown {
  if (!data || typeof data !== 'object') return undefined;
  if (Object.prototype.hasOwnProperty.call(data, fieldPath)) return (data as Schema)[fieldPath];
  return fieldPath.split('.').reduce<unknown>((current, segment) => (
    current && typeof current === 'object' ? (current as Schema)[segment] : undefined
  ), data);
}

function displayableMessages(value: unknown): string[] {
  const values = typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];
  return values
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item !== '' && item !== 'Bad Request');
}

/** SSR-safe focus/scroll helper for the first visible form error. */
export function scrollToError(parentClass: string) {
  if (typeof document === 'undefined') return;
  const parent = document.getElementsByClassName(parentClass).item(0);
  const target = parent?.getElementsByClassName('v-form-group__error').item(0);
  if (target && typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

export function useFormValidation<T extends object>(
  schemaFrontend: JSONSchemaType<T> | Ref<JSONSchemaType<T>>,
  schemaBackend: JSONSchemaType<T> | Ref<JSONSchemaType<T> | undefined> | undefined,
  initialModel: T,
  fieldsPaths: string[] | Ref<string[]>,
  options: FormValidationOptions<T> = {},
): FormValidationReturn<T> {
  const model = reactive<T>(cloneValue(initialModel));
  const validation = ref<unknown>();
  const formErrors = useFormErrors();
  const validator = options.createAjv?.() ?? createDefaultAjv();
  let compiledSchema: {
    source: JSONSchemaType<T>;
    compiled: JSONSchemaType<T>;
    check: (data: unknown) => boolean;
  } | undefined;

  const schemaObject = computed(() => {
    const frontend = cloneValue(unref(schemaFrontend));
    const backend = unref(schemaBackend);
    const backendClone = backend === undefined ? undefined : cloneValue(backend);
    if (options.composeSchema) {
      return cloneValue(options.composeSchema(
        frontend as Readonly<JSONSchemaType<T>>,
        backendClone as Readonly<JSONSchemaType<T>> | undefined,
      ));
    }
    return (backendClone === undefined
      ? frontend
      : mergeSchema(backendClone as Schema, frontend as Schema)) as JSONSchemaType<T>;
  });

  const isValid = computed(() => !formErrors.hasFormErrors(
    validation.value,
    unref(fieldsPaths),
  ));

  const clearCompiledSchema = () => {
    if (compiledSchema) {
      // AJV registers schemas with an $id. Remove the exact clone so a
      // replacement with the same $id can be compiled on this form's
      // validator without affecting host-owned schemas or keywords.
      validator.removeSchema(compiledSchema.compiled);
      compiledSchema = undefined;
    }
  };

  watch(schemaObject, () => {
    clearCompiledSchema();
    validation.value = undefined;
    formErrors.clearErrors();
  }, { deep: true });

  const onValidate = () => {
    let check: (data: unknown) => boolean;
    let candidate: JSONSchemaType<T> | undefined;
    try {
      const source = schemaObject.value;
      if (compiledSchema?.source === source) {
        check = compiledSchema.check;
      } else {
        clearCompiledSchema();
        const compiled = cloneValue(source);
        candidate = compiled;
        check = validator.compile(compiled);
        compiledSchema = { source, compiled, check };
      }
    } catch (error) {
      if (candidate) validator.removeSchema(candidate);
      compiledSchema = undefined;
      formErrors.clearErrors();
      validation.value = undefined;
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Form validation schema compilation failed: ${message}`, { cause: error });
    }

    const preparedModel = cloneValue(model);
    const data = options.prepareData
      ? options.prepareData(preparedModel as Readonly<T>)
      : preparedModel;
    check(data);
    formErrors.setErrors((check as typeof check & { errors?: ErrorObject[] }).errors ?? []);
    validation.value = formErrors.fieldErrors.value;
  };

  const resetValidation = () => {
    validation.value = undefined;
    formErrors.clearErrors();
  };

  watch(model, () => {
    if (!isValid.value && validation.value !== undefined) onValidate();
  }, { deep: true });

  const isFieldRequired = (fieldPath: string) => {
    const root = schemaObject.value as unknown as Schema;
    const field = schemaAtPath(fieldPath, root);
    if (!field) return false;
    const parentPath = fieldPath.split('.').slice(0, -1).join('.');
    let parent = parentPath ? schemaAtPath(parentPath, root) : resolveRef(root, root);
    if (parent?.type === 'array') parent = resolveRef(parent.items, root);
    const fieldName = fieldPath.split('.').at(-1) ?? '';
    return field.required === true || (
      Array.isArray(parent?.required) && parent.required.includes(fieldName)
    );
  };

  const getErrorText = (fieldPath: string, errorData?: MaybeRef<unknown>) => {
    const value = unref(errorData);
    const legacy = displayableMessages(valueAtPath(value, fieldPath));
    const envelope = value && typeof value === 'object' ? (value as Schema).error : undefined;
    const details = envelope && typeof envelope === 'object' ? (envelope as Schema).details : undefined;
    const nested = displayableMessages(valueAtPath(details, fieldPath));
    return [
      formErrors.getFieldError(fieldPath),
      ...(legacy.length ? legacy : nested),
    ].filter(Boolean);
  };

  const getOptions = (fieldPath: string) => {
    let target = schemaAtPath(fieldPath, schemaObject.value as unknown as Schema);
    if (target?.type === 'array') target = resolveRef(target.items, schemaObject.value as unknown as Schema);
    const values = Array.isArray(target?.enum) ? target.enum : [];
    const names = target?.enumNames ?? target?.['x-enumNames'] ?? target?.titles ?? [];
    return values.map((value, index) => {
      const rawName = String((Array.isArray(names) ? names[index] : undefined) ?? value);
      return { value: String(value), name: rawName.charAt(0).toUpperCase() + rawName.slice(1) };
    });
  };

  return {
    model,
    validation,
    isValid,
    onValidate,
    schemaObject,
    resetValidation,
    formErrors,
    isFieldRequired,
    getErrorText,
    scrollToError,
    getOptions,
  };
}
