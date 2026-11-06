import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';

/**
 * The logo for a surface. On a DARK surface (`onDark`) it is the merchant's
 * `logo_on_dark` image setting when one is set; otherwise (a light surface, or
 * the setting empty) it is the store logo. Shared by the header and the footer
 * so the two can't disagree.
 */
export function useStoreLogo(onDark: boolean): string | undefined {
  const { store, theme } = useTwilight();
  const logoOnDark = (theme?.settings as { logo_on_dark?: unknown } | undefined)?.logo_on_dark;
  return onDark && typeof logoOnDark === 'string' && logoOnDark !== '' ? logoOnDark : store?.logo;
}
