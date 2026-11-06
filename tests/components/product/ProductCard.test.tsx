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
    product: { id: number; name: string; image?: { url?: string } };
    layout?: string;
  }) => (
    <div
      className="s-product-card-vertical"
      data-testid="engine-card"
      data-image={product.image?.url}
    >
      <div className="s-product-card-image">
        {layout !== 'horizontal' && (
          <button
            type="button"
            className="s-product-card-wishlist-btn"
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

const product = { id: 42, name: 'Test product' } as never;

beforeEach(() => {
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

  it('unmounts cleanly and survives a layout change', async () => {
    const { rerender, unmount } = render(<ProductCard product={product} layout="vertical" />);

    expect(() => rerender(<ProductCard product={product} layout="horizontal" />)).not.toThrow();
    expect(() => unmount()).not.toThrow();
  });
});
