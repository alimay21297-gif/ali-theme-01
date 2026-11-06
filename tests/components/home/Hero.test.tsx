import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Hero } from '../../../app/components/home/Hero';

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: { to: string; children?: unknown; className?: string }) => (
    <a href={to} className={className}>
      {children as never}
    </a>
  ),
  Image: (props: Record<string, unknown>) => (
    <img
      alt={String(props.alt ?? '')}
      src={String(props.src ?? '')}
      className={String(props.className ?? '')}
    />
  ),
}));

// The animated products name their links through the translation hook.
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fallback?: string) => fallback ?? _k }),
}));

/** A complete animated product: its page, front image and layers. */
const products = {
  animate_products: true,
  p1_link: '/wallet',
  p1_name: 'Wallet',
  p1_body: 'https://cdn.example/wallet-body.webp',
  p1_layers: [{ image: 'https://cdn.example/card-1.webp' }],
};

vi.mock('../../../app/hooks/useCalligraphy', () => ({
  useCalligraphy: () => ({ className: 'has-calligraphy', style: undefined }),
}));

describe('Hero', () => {
  it('renders nothing with no title and no image', () => {
    const { container } = render(<Hero data={{ subtitle: 'x', btnname: 'Go', url: '/' }} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the title as a plain-text h2 with the calligraphy class', () => {
    const { container } = render(<Hero data={{ title: '<b>Hello</b>' }} />);
    const h2 = container.querySelector('h2');
    expect(h2?.textContent).toBe('<b>Hello</b>');
    expect(h2?.querySelector('b')).toBeNull();
    expect(container.querySelector('.home-hero')?.className).toContain('has-calligraphy');
  });

  it('shows the button only with both text and a link', () => {
    const both = render(<Hero data={{ title: 'T', btnname: 'Shop', url: '/products' }} />);
    expect(both.container.querySelector('a')?.getAttribute('href')).toBe('/products');
    both.unmount();

    expect(render(<Hero data={{ title: 'T', btnname: 'Shop' }} />).container.querySelector('a')).toBeNull();
    expect(render(<Hero data={{ title: 'T', url: '/x' }} />).container.querySelector('a')).toBeNull();
  });

  it('drops a link that is not a path or an http(s) address', () => {
    const { container } = render(
      <Hero data={{ title: 'T', btnname: 'Shop', url: 'javascript:alert(1)' }} />
    );
    expect(container.querySelector('a')).toBeNull();
  });

  it('puts the decorative radar behind the product shot: five rings and one pulse', () => {
    const { container } = render(<Hero data={{ title: 'T', image: 'https://cdn.example/p.png' }} />);
    const radar = container.querySelector('.home-hero__media svg.home-hero__radar');
    expect(radar?.getAttribute('aria-hidden')).toBe('true');
    expect(radar?.querySelectorAll('circle')).toHaveLength(6);
    expect(radar?.querySelectorAll('.home-hero__pulse')).toHaveLength(1);
  });

  it('draws no radar without a product shot', () => {
    const { container } = render(<Hero data={{ title: 'T' }} />);
    expect(container.querySelector('.home-hero__radar')).toBeNull();
  });

  describe('animated products', () => {
    const image = 'https://cdn.example/p.png';

    it('shows them instead of the single image when the switch is on and they are complete', () => {
      const { container } = render(<Hero data={{ title: 'T', image, ...products }} />);
      expect(container.querySelector('.product-showcase')).not.toBeNull();
      expect(container.querySelector('.home-hero__media--showcase')).not.toBeNull();
      expect(container.querySelector('.home-hero__image')).toBeNull();
      expect(container.querySelector('a[href="/wallet"]')).not.toBeNull();
    });

    it('falls back to the single image when the switch is off', () => {
      const { container } = render(
        <Hero data={{ title: 'T', image, ...products, animate_products: false }} />
      );
      expect(container.querySelector('.product-showcase')).toBeNull();
      expect(container.querySelector('.home-hero__image')).not.toBeNull();
    });

    it('falls back to the single image when the layers are missing', () => {
      const { container } = render(
        <Hero data={{ title: 'T', image, ...products, p1_layers: [] }} />
      );
      expect(container.querySelector('.product-showcase')).toBeNull();
      expect(container.querySelector('.home-hero__image')).not.toBeNull();
    });

    it('falls back to text only when there is no single image either', () => {
      const { container } = render(<Hero data={{ title: 'T', ...products, p1_layers: [] }} />);
      expect(container.querySelector('.home-hero__media')).toBeNull();
      expect(container.querySelector('h2')?.textContent).toBe('T');
    });

    it('renders for products alone, with no title and no single image', () => {
      const { container } = render(<Hero data={products} />);
      expect(container.querySelector('.product-showcase')).not.toBeNull();
    });
  });

  it('renders an image-only hero without a text column', () => {
    const { container } = render(<Hero data={{ image: 'https://cdn.example/p.png' }} />);
    expect(container.querySelector('.home-hero__text')).toBeNull();
    expect(container.querySelector('img')).not.toBeNull();
  });
});
