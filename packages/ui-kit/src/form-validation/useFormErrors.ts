import { computed, readonly, ref } from 'vue';
import type { ErrorObject } from 'ajv';
import type { ErrorSchema, ValidationError } from './types';

const REQUIRED_ERROR_MESSAGE = 'Please complete';

function pathSegments(path: string): string[] {
  return path.replace(/\[([^\]]+)\]/g, '.$1').split('.').filter(Boolean);
}

function getAtPath(value: unknown, path: string): unknown {
  if (!value || typeof value !== 'object') return undefined;
  return pathSegments(path).reduce<unknown>((current, segment) => (
    current && typeof current === 'object'
      ? (current as Record<string, unknown>)[segment]
      : undefined
  ), value);
}

function lastPropertySegment(path?: string): string {
  if (!path) return '';
  const withoutLeadingSlash = path.replace(/^\//, '');
  const lastSlashSegment = withoutLeadingSlash.split('/').at(-1) ?? '';
  return lastSlashSegment.split('.').at(-1) ?? '';
}

function transformValidationErrors(errors: ErrorObject[] = []): ValidationError[] {
  return errors.flatMap((error) => {
    const { instancePath, keyword, params, schemaPath, message } = error;

    if (keyword === 'errorMessage' && params?.errors) {
      return (params.errors as ErrorObject[]).map((nested) => {
        const nestedParams = nested.params ?? {};
        const base = nested.instancePath
          ? nested.instancePath.replace(/^\//, '').replace(/\//g, '.')
          : '';
        const property = 'missingProperty' in nestedParams
          ? (base ? `${base}.${String(nestedParams.missingProperty)}` : String(nestedParams.missingProperty))
          : base;
        return {
          name: String(nested.keyword),
          property,
          message,
          params: nestedParams,
          schemaPath: String(nested.schemaPath),
        } satisfies ValidationError;
      });
    }

    let property = instancePath
      ? String(instancePath).replace(/^\//, '').replace(/\//g, '.')
      : '';
    const safeParams = params ?? {};
    if ('missingProperty' in safeParams) {
      property = property
        ? `${property}.${String(safeParams.missingProperty)}`
        : String(safeParams.missingProperty);
    }
    if ('failingKeyword' in safeParams) {
      property = property
        ? `${property}.${String(safeParams.failingKeyword)}`
        : String(safeParams.failingKeyword);
    }

    let messageFormatted = message;
    if (keyword === 'required') messageFormatted = REQUIRED_ERROR_MESSAGE;
    if (keyword === 'minLength') {
      messageFormatted = `Should have at least ${String(safeParams.limit)} characters`;
    }

    return [{
      name: String(keyword),
      property,
      message: messageFormatted,
      params: safeParams,
      schemaPath: String(schemaPath),
    } satisfies ValidationError];
  });
}

function formatErrorSchema(schema: ErrorSchema): Record<string, unknown> | string | undefined {
  if ('__errors' in schema) {
    const list = schema.__errors ?? [];
    return list.length ? list.join(', ') : undefined;
  }

  const formatted: Record<string, unknown> = {};
  Object.keys(schema).forEach((key) => {
    const value = formatErrorSchema(schema[key]);
    if (value !== undefined) formatted[key] = value;
  });
  return formatted;
}

function buildFieldErrors(rawErrors: ErrorObject[]): Record<string, unknown> {
  const errors = transformValidationErrors(rawErrors);
  const schema: ErrorSchema = {};

  errors.forEach(({ property, message }) => {
    if (!message) return;
    const segments = property === '.' ? [] : pathSegments(property);
    if (segments[0] === '') segments.shift();

    let node: ErrorSchema = schema;
    segments.forEach((segment) => {
      if (!node[segment] || typeof node[segment] !== 'object') node[segment] = {};
      node = node[segment];
    });
    node.__errors ??= [];
    node.__errors.push(message);
  });

  const formatted = formatErrorSchema(schema);
  return formatted && typeof formatted === 'object' ? formatted : {};
}

function containsStringError(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.some(containsStringError);
  if (value && typeof value === 'object') return Object.values(value).some(containsStringError);
  return false;
}

export function useFormErrors() {
  const rawErrors = ref<ErrorObject[]>([]);
  const ignoredFieldNames = ref<string[]>([]);
  const ignoredSet = computed(() => new Set(ignoredFieldNames.value));
  const filteredErrors = computed(() => rawErrors.value.filter((error) => (
    !ignoredSet.value.has(lastPropertySegment(error.instancePath))
  )));
  const fieldErrors = computed(() => buildFieldErrors(filteredErrors.value));
  const hasErrors = computed(() => Object.keys(fieldErrors.value).length > 0);

  function setErrors(errors: ErrorObject[] | undefined | null) {
    rawErrors.value = Array.isArray(errors) ? errors : [];
    ignoredFieldNames.value = [];
  }

  function clearErrors() {
    rawErrors.value = [];
    ignoredFieldNames.value = [];
  }

  function clearFieldError(fieldName: string) {
    if (!fieldName || ignoredSet.value.has(fieldName)) return;
    ignoredFieldNames.value = [...ignoredFieldNames.value, fieldName];
  }

  function hasFieldError(path: string) {
    if (!path) return false;
    return typeof getAtPath(fieldErrors.value, path) === 'string';
  }

  function getFieldError(path: string) {
    if (!path) return '';
    const value = getAtPath(fieldErrors.value, path);
    return typeof value === 'string' ? value : '';
  }

  const hasFormErrors = (errors: unknown, fieldPaths: string[]) => (
    fieldPaths.some((path) => containsStringError(getAtPath(errors, path)))
  );

  return {
    rawErrors: readonly(rawErrors),
    fieldErrors,
    hasErrors,
    setErrors,
    clearErrors,
    clearFieldError,
    hasFieldError,
    getFieldError,
    hasFormErrors,
  };
}
