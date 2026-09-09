import type { HTMLAttributes } from 'vue';

export interface UiFieldProps {
  asChild?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  class?: HTMLAttributes['class'];
  unstyled?: boolean;
}
