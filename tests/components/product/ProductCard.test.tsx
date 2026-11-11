import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { ProductCard } from '../../../app/components/product/ProductCard';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../../app/lib/productImage';

// Mirrors the real engine's conditional: the image-corner wishlist button only
// renders for `!isHorizontal && !isFullImage` (theme-engine ProductCard.tsx) —
// a `layout` change on an already-mounted card unmounts just that button while
// its siblings (and the whole card) stay mounted.
vi.mock('@salla.sa/twilight-theme-engine/product', () => ({
  ProductCard: ({
    product,
    layout = 'vertical',
  }: {
    product: { id: number; name: string; image?: { url?: string }; promotion_title?: string };
    layout?: string;
  }) => (
    <div
      className="s-product-card-vertical"
      data-testid="engine-card"
      data-image={product.image?.url}
    >
      <div className="s-product-card-image">
        {product.promotion_title && (
          <div className="s-product-card-promotion-title" data-testid="badge">
            {product.promotion_title}
          </div>
        )}
        {layout !== 'horizontal' && (
          <button
            type="button"
            className={`s-product-card-wishlist-btn animated ${
              product.id === 99 ? 's-product-card-wishlist-added pulse-anime' : 'not-added un-favorited'
            }`}
            aria-label="engine wishlist"
          >
            {product.name}
          </button>
        )}
      </div>
      <div className="s-product-card-content-footer" data-testid="footer">
        <salla-add-product-button fill="outline" />
      </div>
    </div>
  ),
}));

const i18n = vi.hoisted(() => ({
  locale: 'en',
  messages: {
    en: { 'pages.products.discount_badge': '{{percent}}% off', 'pages.products.sold_out': 'Sold out' },
    ar: { 'pages.products.discount_badge': 'خصم {{percent}}٪', 'pages.products.sold_out': 'نفذت الكمية' },
  } as Record<string, Record<string, string>>,
}));

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => {
  const t = (key: string, options: { defaultValue: string; percent?: string }) =>
    (i18n.messages[i18n.locale][key] ?? options.defaultValue).replace(
      '{{percent}}',
      options.percent ?? ''
    );
  return { useTranslation: () => ({ t, locale: i18n.locale }) };
});

const product = { id: 42, name: 'Test product' } as never;
const saleProduct = { id: 7, name: 'Sale', is_on_sale: true, regular_price: 200, sale_price: 150 };

beforeEach(() => {
  i18n.locale = 'en';
  cleanup();
});

describe('ProductCard', () => {
  it('shows the placeholder, whole, for a product with no photo', () => {
    const { getByTestId } = render(<ProductCard product={product} />);
    const card = getByTestId('engine-card');
    expect(card.getAttribute('data-image')).toBe(PRODUCT_IMAGE_PLACEHOLDER);
    expect(card.parentElement?.hasAttribute('data-image-placeholder')).toBe(true);
  });

  it('leaves a product with a photo as it is', () => {
    const photo = { id: 1, name: 'Photo', image: { url: 'https://example.com/a.jpg' } } as never;
    const { getByTestId } = render(<ProductCard product={photo} />);
    const card = getByTestId('engine-card');
    expect(card.getAttribute('data-image')).toBe('https://example.com/a.jpg');
    expect(card.parentElement?.hasAttribute('data-image-placeholder')).toBe(false);
  });

  it('badges a discounted product with its computed percentage, in locale digits', () => {
    const en = render(<ProductCard product={saleProduct as never} />);
    expect(en.getByTestId('badge').textContent).toBe('25% off');
    en.unmount();

    i18n.locale = 'ar';
    const ar = render(<ProductCard product={saleProduct as never} />);
    expect(ar.getByTestId('badge').textContent).toBe('خصم ٢٥٪');
  });

  it("shows the merchant's promotion title instead of the computed one, never both", () => {
    const titled = { ...saleProduct, promotion_title: 'عرض خاص' };
    const { getAllByTestId } = render(<ProductCard product={titled as never} />);
    expect(getAllByTestId('badge')).toHaveLength(1);
    expect(getAllByTestId('badge')[0].textContent).toBe('عرض خاص');
  });

  it('badges an out-of-stock product "Sold out" instead of the sale badge', () => {
    const soldOut = { ...saleProduct, is_out_of_stock: true };
    const { getAllByTestId } = render(<ProductCard product={soldOut as never} />);
    expect(getAllByTestId('badge')).toHaveLength(1);
    expect(getAllByTestId('badge')[0].textContent).toBe('Sold out');
  });

  it('makes the add-to-cart button solid and centres its loader', async () => {
    const { getByTestId } = render(<ProductCard product={product} />);

    await waitFor(() => {
      const button = getByTestId('footer').querySelector('salla-add-product-button');
      expect(button?.getAttribute('fill')).toBe('solid');
      expect(button?.getAttribute('loader-position')).toBe('center');
    });
  });

  it('leaves the engine image-corner wishlist button where it is, visible, with no duplicate', async () => {
    const { getByTestId, getByLabelText } = render(<ProductCard product={product} />);
    await waitFor(() =>
      expect(getByTestId('footer').querySelector('salla-add-product-button')?.getAttribute('fill')).toBe(
        'solid'
      )
    );

    const heart = getByLabelText('engine wishlist');
    expect(heart.closest('.s-product-card-image')).toBeTruthy();
    expect(heart.style.display).not.toBe('none');
    expect(getByTestId('footer').querySelector('button')).toBeNull();
  });

  describe('wishlist heart pressed state', () => {
    const heartOf = (container: HTMLElement) =>
      container.querySelector<HTMLButtonElement>('button.s-product-card-wishlist-btn')!;

    it('is not pressed by default', async () => {
      const { container } = render(<ProductCard product={product} />);

      await waitFor(() => expect(heartOf(container).getAttribute('aria-pressed')).toBe('false'));
    });

    it('is pressed when the saved class is present', async () => {
      const { container } = render(<ProductCard product={{ id: 99, name: 'Saved' } as never} />);

      await waitFor(() => expect(heartOf(container).getAttribute('aria-pressed')).toBe('true'));
    });

    it('follows a class change in both directions', async () => {
      const { container } = render(<ProductCard product={product} />);
      const heart = heartOf(container);
      await waitFor(() => expect(heart.getAttribute('aria-pressed')).toBe('false'));

      heart.classList.add('s-product-card-wishlist-added');
      await waitFor(() => expect(heart.getAttribute('aria-pressed')).toBe('true'));

      heart.classList.remove('s-product-card-wishlist-added');
      await waitFor(() => expect(heart.getAttribute('aria-pressed')).toBe('false'));
    });

    it('reads a salla-button host class and writes only to the inner button', async () => {
      const { container } = render(<ProductCard product={product} />);
      const heart = heartOf(container);
      const host = document.createElement('salla-button');
      host.className = 's-product-card-wishlist-btn';
      heart.replaceWith(host);
      host.append(heart);
      await waitFor(() => expect(heart.getAttribute('aria-pressed')).toBe('false'));

      host.classList.add('s-product-card-wishlist-added');
      await waitFor(() => expect(heart.getAttribute('aria-pressed')).toBe('true'));
      expect(host.hasAttribute('aria-pressed')).toBe(false);
    });
  });

  it('unmounts cleanly and survives a layout change', async () => {
    const { rerender, unmount } = render(<ProductCard product={product} layout="vertical" />);

    expect(() => rerender(<ProductCard product={product} layout="horizontal" />)).not.toThrow();
    expect(() => unmount()).not.toThrow();
  });
});
