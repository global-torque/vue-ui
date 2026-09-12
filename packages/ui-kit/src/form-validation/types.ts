import type { JSONSchemaType } from 'ajv/dist/types/json-schema';

/** The normalized error shape used by the neutral form helpers. */
export interface ValidationError {
  name: string;
  property: string;
  message?: string;
  params?: Record<string, unknown>;
  schemaPath?: string;
}

/** A nested field-error tree, with messages stored in `__errors`. */
export type ErrorSchema<T = unknown> = {
  [key: string]: ErrorSchema<T>;
} & {
  __errors?: string[];
};

/** Optional policy hooks supplied by a consuming application. */
export interface FormValidationOptions<T extends object = object> {
  /** Create the validator used by this form instance. */
  createAjv?: () => import('ajv').default;
  /** Compose cloned frontend and backend schemas without changing either input. */
  composeSchema?: (
    frontend: Readonly<JSONSchemaType<T>>,
    backend: Readonly<JSONSchemaType<T>> | undefined,
  ) => JSONSchemaType<T>;
  /** Prepare a cloned model for validation. */
  prepareData?: (model: Readonly<T>) => unknown;
}

export interface UseFormOptions<T = Record<string, unknown>> {
  initialValues: T | import('vue').Ref<T> | (() => T);
  currentValues: T | import('vue').Ref<T>;
  compareFn?: (initial: T, current: T) => boolean;
  normalize?: boolean;
}
