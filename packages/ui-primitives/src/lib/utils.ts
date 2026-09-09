import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/* The geometry tokens of styles/theme.css, so tailwind-merge resolves e.g.
   `text-control-sm` against `text-sm` (font size) and not against
   `text-primary` (colour). */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['control', 'control-sm', 'control-lg', 'table', 'table-head'],
      color: ['table-head-foreground', 'control-background'],
      spacing: ['control-sm', 'control-md', 'control-lg', 'table-cell'],
      radius: ['control'],
      'font-weight': ['control', 'table-head'],
    },
  },
});

/** Merges Tailwind class lists the way shadcn-vue components expect. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
