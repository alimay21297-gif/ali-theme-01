import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import {
  ProductShowcase,
  type ShowcaseProduct,
} from '../../../app/components/home/ProductShowcase';

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({
    to,
    children,
    className,
    ...rest
  }: { to: string; children?: unknown; className?: string } & Record<string, unknown>) => (
    <a href={to} className={className} {...(rest as Record<string, unknown>)}>
      {children as never}
    </a>
  ),
  Image: ({
    src,
    priority,
    className,
    style,
  }: {
    src: string;
    priority?: boolean;
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <img
      src={src}
      alt=""
      className={className}
      style={style}
      data-priority={priority ? 'high' : 'lazy'}
    />
  ),
}));
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fallback?: string) => fallback ?? _k }),
}));

const wallet: ShowcaseProduct = {
  type: 'slide',
  url: '/wallet',
  name: 'Card wallet',
  body: 'wallet-body.webp',
  layers: ['card-1.webp', 'card-2.webp', 'card-3.webp'],
};
const keys: ShowcaseProduct = {
  type: 'swing',
  url: '/keys',
  body: 'keys-body.webp',
  layers: ['inner.webp', 'outer.webp'],
  pivotX: 53,
  pivotY: 71.1,
};

type IOCallback = (entries: { isIntersecting: boolean }[]) => void;
let observers: { callback: IOCallback; disconnected: boolean }[] = [];

/** `hover` and `reduced` choose how the media queries answer. */
function mockEnvironment({ hover, reduced }: { hover: boolean; reduced: boolean }) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion')
      ? reduced
      : query.includes('hover: none')
        ? !hover
        : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  vi.useFakeTimers();
  observers = [];
  window.IntersectionObserver = class {
    entry: { callback: IOCallback; disconnected: boolean };
    constructor(callback: IOCallback) {
      this.entry = { callback, disconnected: false };
      observers.push(this.entry);
    }
    observe() {}
    unobserve() {}
    disconnect() {
      this.entry.disconnected = true;
    }
  } as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ProductShowcase', () => {
  it('renders nothing without products', () => {
    mockEnvironment({ hover: true, reduced: false });
    const { container } = render(<ProductShowcase products={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('makes each product one link to its page, named for screen readers', () => {
    mockEnvironment({ hover: true, reduced: false });
    const { container } = render(<ProductShowcase products={[wallet, keys]} />);

    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/wallet');
    expect(links[0].getAttribute('aria-label')).toBe('Card wallet');
    expect(links[1].getAttribute('href')).toBe('/keys');
    // No name: the translated fallback names the link.
    expect(links[1].getAttribute('aria-label')).toBe('View product');
    // The product's images are inside its link, not links of their own.
    expect(links[0].querySelectorAll('img')).toHaveLength(4);
    expect(links[1].querySelectorAll('img')).toHaveLength(3);
  });

  it('loads the body images eagerly and the layers lazily', () => {
    mockEnvironment({ hover: true, reduced: false });
    const { container } = render(<ProductShowcase products={[wallet, keys]} />);

    const bodies = container.querySelectorAll('img.product-showcase__body');
    const layers = container.querySelectorAll('img.product-showcase__layer');
    expect(bodies).toHaveLength(2);
    bodies.forEach((img) => expect(img.getAttribute('data-priority')).toBe('high'));
    expect(layers).toHaveLength(5);
    layers.forEach((img) => expect(img.getAttribute('data-priority')).toBe('lazy'));
  });

  it('sets the swing pivot and a staircase for the slide, back card furthest', () => {
    mockEnvironment({ hover: true, reduced: false });
    const { container } = render(<ProductShowcase products={[wallet, keys]} />);

    const [slide, swing] = Array.from(container.querySelectorAll<HTMLElement>('a'));
    expect(swing.style.getPropertyValue('--pivot-x')).toBe('53%');
    expect(swing.style.getPropertyValue('--pivot-y')).toBe('71.1%');

    const cards = Array.from(slide.querySelectorAll<HTMLElement>('.product-showcase__layer'));
    expect(cards.map((c) => c.style.getPropertyValue('--open-x'))).toEqual(['16%', '30.5%', '45%']);
    expect(cards.map((c) => c.style.getPropertyValue('--delay'))).toEqual([
      '210ms',
      '130ms',
      '50ms',
    ]);
  });

  it('opens once on a touch screen, 600ms after the product is in view', () => {
    mockEnvironment({ hover: false, reduced: false });
    const { container } = render(<ProductShowcase products={[wallet]} />);
    const link = container.querySelector('a')!;

    expect(link.className).not.toContain('is-open');
    act(() => observers[0].callback([{ isIntersecting: true }]));
    expect(link.className).not.toContain('is-open');
    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(link.className).not.toContain('is-open');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(link.className).toContain('is-open');
    expect(observers[0].disconnected).toBe(true);
  });

  it('does not open by itself where there is hover (desktop opens on hover and focus in CSS)', () => {
    mockEnvironment({ hover: true, reduced: false });
    const { container } = render(<ProductShowcase products={[wallet]} />);

    expect(observers).toHaveLength(0);
    expect(container.querySelector('a')!.className).not.toContain('is-open');
  });

  it('shows the open state with no motion when reduced motion is on', () => {
    mockEnvironment({ hover: false, reduced: true });
    const { container } = render(<ProductShowcase products={[wallet, keys]} />);

    container.querySelectorAll('a').forEach((link) => expect(link.className).toContain('is-static'));
    // Nothing waits to open: any observer made before the preference was read is
    // disconnected, and no timer is left to open them.
    observers.forEach((observer) => expect(observer.disconnected).toBe(true));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    container.querySelectorAll('a').forEach((link) => expect(link.className).not.toContain('is-open'));
  });
});
