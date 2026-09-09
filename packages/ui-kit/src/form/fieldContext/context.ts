import {
  computed,
  defineComponent,
  inject,
  provide,
  toRaw,
  type ComputedRef,
  type InjectionKey,
  type PropType,
} from 'vue';

export interface UiFieldContext {
  inputId: ComputedRef<string>;
  labelId: ComputedRef<string | undefined>;
  errorId: ComputedRef<string | undefined>;
  helperId: ComputedRef<string | undefined>;
  describedBy: ComputedRef<string | undefined>;
  invalid: ComputedRef<boolean>;
  required: ComputedRef<boolean>;
}

type Attrs = Record<string, unknown>;
type AriaBooleanish = boolean | 'true' | 'false';
type AriaInvalid = AriaBooleanish | 'grammar' | 'spelling';

const uiFieldContextKey: InjectionKey<UiFieldContext> = Symbol('UiFieldContext');

export function provideUiFieldContext(context: UiFieldContext) {
  provide(uiFieldContextKey, context);
}

export const UiFieldContextProvider = defineComponent({
  name: 'UiFieldContextProvider',
  props: {
    context: {
      type: Object as PropType<UiFieldContext>,
      required: true,
    },
  },
  setup(props, { slots }) {
    provideUiFieldContext(toRaw(props.context));
    return () => slots.default?.();
  },
});

export function useUiFieldContext() {
  return inject(uiFieldContextKey, null);
}

export function hasExplicitUiFieldAttr(attrs: Attrs, key: string) {
  return Object.prototype.hasOwnProperty.call(attrs, key);
}

export function uiFieldAttrToString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === false) return undefined;
  return String(value);
}

function attrToAriaBooleanish(value: unknown): AriaBooleanish | undefined {
  if (value === true || value === false) return value;
  const stringValue = uiFieldAttrToString(value);
  if (stringValue === 'true' || stringValue === 'false') return stringValue;
  return undefined;
}

function attrToAriaInvalid(value: unknown): AriaInvalid | undefined {
  const booleanish = attrToAriaBooleanish(value);
  if (booleanish !== undefined) return booleanish;
  const stringValue = uiFieldAttrToString(value);
  if (stringValue === 'grammar' || stringValue === 'spelling') return stringValue;
  return undefined;
}

export function omitUiFieldAttrs(attrs: Attrs, keys: string[]) {
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => !keys.includes(key)));
}

export function createUiFieldContext(options: Omit<UiFieldContext, 'describedBy'>): UiFieldContext {
  const describedBy = computed(() => [
    options.invalid.value ? options.errorId.value : undefined,
    options.helperId.value,
  ].filter(Boolean).join(' ') || undefined);
  return { ...options, describedBy };
}

export function resolveUiFieldControlId(
  attrs: Attrs,
  context: UiFieldContext | null,
  fallbackId?: string,
) {
  return uiFieldAttrToString(attrs.id) ?? context?.inputId.value ?? fallbackId;
}

export function getUiFieldControlA11yAttrs(
  attrs: Attrs,
  context: UiFieldContext | null,
  options: {
    id?: string;
    invalid?: boolean;
    required?: boolean;
    labelledBy?: boolean;
    includeControlInLabel?: boolean;
  } = {},
) {
  const id = options.id ?? resolveUiFieldControlId(attrs, context);
  const invalid = options.invalid ?? context?.invalid.value ?? false;
  const required = options.required ?? context?.required.value ?? false;
  const labelledBy = options.labelledBy
    ? [context?.labelId.value, options.includeControlInLabel ? id : undefined].filter(Boolean).join(' ') || undefined
    : undefined;

  return {
    id,
    'aria-describedby': hasExplicitUiFieldAttr(attrs, 'aria-describedby')
      ? uiFieldAttrToString(attrs['aria-describedby'])
      : context?.describedBy.value,
    'aria-invalid': hasExplicitUiFieldAttr(attrs, 'aria-invalid')
      ? attrToAriaInvalid(attrs['aria-invalid'])
      : invalid ? true : undefined,
    'aria-required': hasExplicitUiFieldAttr(attrs, 'aria-required')
      ? attrToAriaBooleanish(attrs['aria-required'])
      : required ? true : undefined,
    'aria-labelledby': hasExplicitUiFieldAttr(attrs, 'aria-labelledby')
      ? uiFieldAttrToString(attrs['aria-labelledby'])
      : labelledBy,
  };
}
