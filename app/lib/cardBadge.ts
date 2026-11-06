import { formatDigits } from './formatDigits';

/** What the card badge needs from a product. */
export interface BadgeProduct {
  is_on_sale?: boolean;
  is_out_of_stock?: boolean;
  promotion_title?: string | null;
  regular_price?: number | null;
  sale_price?: number | null;
  price?: number | string | null;
  preorder?: { label?: unknown } | null;
}

/** The part of the engine's `t` this file uses. */
export type BadgeTranslate = (
  key: string,
  options: { defaultValue: string; percent?: string }
) => string;

/**
 * Whole-number discount between the regular and the sale price, or `null` when
 * there is nothing worth showing (under 1%, or prices that don't make sense).
 * Rounded to the nearest percent, and never 100 for a product that still costs
 * something.
 */
export function discountPercent(regular: unknown, sale: unknown): number | null {
  const was = Number(regular);
  const now = Number(sale);
  if (!Number.isFinite(was) || !Number.isFinite(now) || was <= 0 || now < 0 || now >= was) {
    return null;
  }
  const percent = Math.round(((was - now) / was) * 100);
  if (percent < 1) return null;
  return now > 0 ? Math.min(percent, 99) : percent;
}

/**
 * The one badge text a card shows, or `undefined` to leave the engine's own
 * choice alone. In order: a pre-order label (the engine's), "Sold out", the
 * merchant's promotion title, then the computed discount ("25% off").
 */
export function cardBadgeText(
  product: BadgeProduct,
  locale: string,
  t: BadgeTranslate
): string | undefined {
  if (typeof product.preorder?.label === 'string' && product.preorder.label) return undefined;

  if (product.is_out_of_stock) {
    return t('pages.products.sold_out', { defaultValue: 'Sold out' });
  }

  if (product.promotion_title?.trim()) return undefined;

  if (!product.is_on_sale) return undefined;
  const percent = discountPercent(product.regular_price, product.sale_price ?? product.price);
  if (percent === null) return undefined;

  return t('pages.products.discount_badge', {
    defaultValue: '{{percent}}% off',
    percent: formatDigits(percent, locale),
  });
}
