import type { CSSProperties } from 'react';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';

const OPACITY = { subtle: 0.05, standard: 0.08, strong: 0.12 } as const;

type Strength = keyof typeof OPACITY;

/** Read a dropdown setting that arrives as a string or as `[{ value }]`. */
function dropdownValue(raw: unknown): string | undefined {
  const first = Array.isArray(raw) ? raw[0] : raw;
  return typeof first === 'string' ? first : (first as { value?: string } | undefined)?.value;
}

export interface Calligraphy {
  /** `has-calligraphy` when the merchant has the background on, otherwise empty. */
  className: string;
  /** Sets `--calligraphy-opacity` from the strength setting; undefined when off. */
  style: CSSProperties | undefined;
}

/**
 * The calligraphy background for a DARK surface (`calligraphy_bg_enabled`,
 * `calligraphy_bg_strength`; styles in `04-components/calligraphy.scss`).
 * A never-saved switch counts as on. Spread onto dark surfaces only.
 *
 * `scale` multiplies the chosen strength for a surface that should be quieter
 * than the hero (the footer passes 0.6).
 */
export function useCalligraphy(scale = 1): Calligraphy {
  const { theme } = useTwilight();
  const settings = theme?.settings as
    | { calligraphy_bg_enabled?: unknown; calligraphy_bg_strength?: unknown }
    | undefined;

  if (settings?.calligraphy_bg_enabled === false) return { className: '', style: undefined };

  const value = dropdownValue(settings?.calligraphy_bg_strength);
  const strength: Strength = value && value in OPACITY ? (value as Strength) : 'standard';
  return {
    className: 'has-calligraphy',
    style: {
      '--calligraphy-opacity': Math.round(OPACITY[strength] * scale * 10000) / 10000,
    } as CSSProperties,
  };
}
