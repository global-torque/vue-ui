// Tone classes for a status badge rendered with `@global-torque/ui-primitives/badge`
// (`variant="outline"` + these classes). Solid tones paint a colour under its
// `-foreground` text; soft tones paint a light tint of it, and `neutral` the
// input grey, under `text-foreground`. The colours are the shadcn variables
// (`--success`, `--warning`, `--info`, `--destructive`, …) that
// `@global-torque/ui-primitives/styles/theme` declares. The legacy colour names
// the investment formatters still emit map onto the tones here, so call sites
// stay one-liners.
export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'primary-soft'
  | 'success'
  | 'success-soft'
  | 'warning'
  | 'warning-soft'
  | 'danger'
  | 'danger-soft'
  | 'info'
  | 'info-soft';

// Literal class strings on purpose: Tailwind only emits what it can read.
const toneClasses: Record<BadgeTone, string> = {
  'neutral': 'border-transparent bg-input text-foreground',
  'primary': 'border-transparent bg-primary text-primary-foreground',
  'primary-soft': 'border-transparent bg-accent text-foreground',
  'success': 'border-transparent bg-success text-success-foreground',
  'success-soft': 'border-transparent bg-success/20 text-foreground',
  'warning': 'border-transparent bg-warning text-warning-foreground',
  'warning-soft': 'border-transparent bg-warning/10 text-foreground',
  'danger': 'border-transparent bg-destructive text-destructive-foreground',
  'danger-soft': 'border-transparent bg-destructive/10 text-foreground',
  'info': 'border-transparent bg-info text-info-foreground',
  'info-soft': 'border-transparent bg-info/5 text-foreground',
};

const legacyColours: Record<string, BadgeTone> = {
  'primary': 'primary',
  'primary-light': 'primary-soft',
  'secondary': 'success',
  'secondary-light': 'success-soft',
  'red': 'danger',
  'red-light': 'danger-soft',
  'yellow': 'warning',
  'yellow-light': 'warning-soft',
  'purple': 'info',
  'purple-light': 'info-soft',
  'default': 'neutral',
};

/** Classes for a tone, or for a legacy colour name (`secondary-light`, `red-light`, ...). */
export function badgeToneClass(tone?: string | null): string {
  const resolved = !tone ? 'neutral' : tone in toneClasses ? tone as BadgeTone : legacyColours[tone] ?? 'neutral';
  return `${toneClasses[resolved]} badge-tone-${resolved}`;
}
