import { describe, it, expect } from 'vitest';
import ar from '../../locales/ar.json';
import en from '../../locales/en.json';
import { cardBadgeText, discountPercent, type BadgeTranslate } from '../../app/lib/cardBadge';

/** The engine's `t` for one locale: the theme's own text, `{{x}}` filled in. */
const translator =
  (messages: Record<string, string>): BadgeTranslate =>
  (key, options) => {
    const text = messages[key] ?? options.defaultValue;
    return text.replace('{{percent}}', options.percent ?? '');
  };
const tAr = translator(ar as Record<string, string>);
const tEn = translator(en as Record<string, string>);

const onSale = { is_on_sale: true, regular_price: 200, sale_price: 150 };

describe('discountPercent', () => {
  it('works out the whole-number discount', () => {
    expect(discountPercent(200, 150)).toBe(25);
    expect(discountPercent(1000, 900)).toBe(10);
  });

  it('rounds to the nearest percent', () => {
    expect(discountPercent(3, 2)).toBe(33);
    expect(discountPercent(1118.85, 216.2)).toBe(81);
  });

  it('hides a discount under 1%', () => {
    expect(discountPercent(1000, 996)).toBeNull();
    expect(discountPercent(1000, 995.1)).toBeNull();
    expect(discountPercent(1000, 995)).toBe(1);
  });

  it('never shows 100% for a product that still costs something', () => {
    expect(discountPercent(10000, 1)).toBe(99);
    expect(discountPercent(100, 0)).toBe(100);
  });

  it('shows nothing for prices that are not a discount', () => {
    expect(discountPercent(100, 100)).toBeNull();
    expect(discountPercent(100, 120)).toBeNull();
    expect(discountPercent(0, 0)).toBeNull();
    expect(discountPercent(undefined, 50)).toBeNull();
    expect(discountPercent('abc', 50)).toBeNull();
  });

  it('accepts prices sent as numeric strings', () => {
    expect(discountPercent('200', '150')).toBe(25);
  });
});

describe('cardBadgeText', () => {
  it('shows the computed discount on a sale, with Arabic-Indic digits in Arabic', () => {
    expect(cardBadgeText(onSale, 'ar', tAr)).toBe('خصم ٢٥٪');
  });

  it('shows the computed discount with Latin digits in English', () => {
    expect(cardBadgeText(onSale, 'en', tEn)).toBe('25% off');
  });

  it('falls back to the price when the list sends no sale_price', () => {
    const product = { is_on_sale: true, regular_price: 200, sale_price: null, price: 100 };
    expect(cardBadgeText(product, 'en', tEn)).toBe('50% off');
  });

  it("leaves the merchant's promotion title alone, so it is the only badge", () => {
    expect(cardBadgeText({ ...onSale, promotion_title: 'عرض خاص' }, 'ar', tAr)).toBeUndefined();
  });

  it('ignores a blank promotion title', () => {
    expect(cardBadgeText({ ...onSale, promotion_title: '   ' }, 'en', tEn)).toBe('25% off');
  });

  it('shows nothing for a product that is not on sale', () => {
    expect(cardBadgeText({ regular_price: 200, sale_price: null }, 'en', tEn)).toBeUndefined();
  });

  it('shows nothing when the discount is under 1%', () => {
    const product = { is_on_sale: true, regular_price: 1000, sale_price: 996 };
    expect(cardBadgeText(product, 'en', tEn)).toBeUndefined();
  });

  it('shows "Sold out" on an out-of-stock product, instead of the sale or promotion badge', () => {
    const product = { ...onSale, is_out_of_stock: true, promotion_title: 'عرض خاص' };
    expect(cardBadgeText(product, 'en', tEn)).toBe('Sold out');
    expect(cardBadgeText(product, 'ar', tAr)).toBe('نفذت الكمية');
  });

  it("leaves the engine's pre-order label alone", () => {
    const product = { ...onSale, is_out_of_stock: true, preorder: { label: 'Pre-order' } };
    expect(cardBadgeText(product, 'en', tEn)).toBeUndefined();
  });
});
