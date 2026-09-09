// Tone classes for a status badge rendered with `@global-torque/ui-primitives/badge`
// (`variant="outline"` + these classes). Solid tones paint the brand colour,
// soft tones a light tint of it under the muted badge text. The hues come from
// the brand tokens (`--color-status-*` with the chart colours as fallback), so
// the legacy colour names the investment formatters still emit map onto them
// here and call sites stay one-liners.
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
  'neutral': 'border-transparent bg-input text-(color:--color-badge-foreground,var(--muted-foreground))',
  'primary': 'border-transparent bg-primary text-primary-foreground',
  'primary-soft': 'border-transparent bg-accent text-(color:--color-badge-foreground,var(--muted-foreground))',
  'success': 'border-transparent bg-[var(--color-status-success,var(--chart-2))] text-(color:--color-badge-foreground,var(--muted-foreground))',
  'success-soft': 'border-transparent bg-[color-mix(in_srgb,var(--color-status-success,var(--chart-2))_20%,var(--background))] text-(color:--color-badge-foreground,var(--muted-foreground))',
  'warning': 'border-transparent bg-[var(--color-status-warning,var(--chart-3))] text-foreground',
  'warning-soft': 'border-transparent bg-[color-mix(in_srgb,var(--color-status-warning,var(--chart-3))_10%,var(--background))] text-(color:--color-badge-foreground,var(--muted-foreground))',
  'danger': 'border-transparent bg-destructive text-white',
  'danger-soft': 'border-transparent bg-[color-mix(in_srgb,var(--destructive)_10%,var(--background))] text-(color:--color-badge-foreground,var(--muted-foreground))',
  'info': 'border-transparent bg-[var(--color-status-info,var(--chart-4))] text-white',
  'info-soft': 'border-transparent bg-[color-mix(in_srgb,var(--color-status-info,var(--chart-4))_5%,var(--background))] text-(color:--color-badge-foreground,var(--muted-foreground))',
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
