import {
  createUiFieldContext,
  getUiFieldControlA11yAttrs,
  hasExplicitUiFieldAttr,
  omitUiFieldAttrs,
  provideUiFieldContext,
  resolveUiFieldControlId,
  UiFieldContextProvider,
  uiFieldAttrToString,
  useUiFieldContext,
  type UiFieldContext,
} from './fieldContext/context';

export type VFormFieldContext = UiFieldContext;
export const VFormFieldContextProvider = UiFieldContextProvider;
export const provideVFormFieldContext = provideUiFieldContext;
export const useVFormFieldContext = useUiFieldContext;
export const hasExplicitAttr = hasExplicitUiFieldAttr;
export const attrToString = uiFieldAttrToString;
export const omitAttrs = omitUiFieldAttrs;
export const createFormFieldContext = createUiFieldContext;
export const resolveFormControlId = resolveUiFieldControlId;
export const getFormControlA11yAttrs = getUiFieldControlA11yAttrs;
