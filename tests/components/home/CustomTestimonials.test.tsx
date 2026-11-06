import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CustomTestimonials } from '../../../app/components/home/CustomTestimonials';

// Only the module under test, not the whole barrel and everything it re-exports.
vi.mock('../../../app/components/common', async () => ({
  TestimonialsCarousel: (await vi.importActual<typeof import('../../../app/components/common/TestimonialsCarousel')>(
    '../../../app/components/common/TestimonialsCarousel'
  )).TestimonialsCarousel,
}));

const mockLocale = vi.hoisted(() => ({ value: 'en' }));

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({
    locale: mockLocale.value,
    // i18next-style: a fallback string, or { defaultValue, ...params } with {{name}} slots.
    t: (key: string, arg?: string | Record<string, string>) => {
      if (typeof arg === 'string') return arg;
      if (!arg) return key;
      const { defaultValue, ...params } = arg;
      return (defaultValue ?? key).replace(/\{\{(\w+)\}\}/g, (_m, name) => params[name] ?? '');
    },
  }),
}));

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

const items = [
  { avatar: 'a1.jpg', name: 'ندى الحسيني', text: 'رائحة رائعة', stars: 5 },
  { avatar: 'a2.jpg', name: 'خالد الأحمد', text: 'أنصح به', stars: 4 },
  { avatar: 'a3.jpg', name: 'هند الزهراني', text: 'ممتاز', stars: 5 },
];

beforeEach(() => {
  Element.prototype.scrollBy = vi.fn();
  // A row that overflows: jsdom has no layout, so everything else would "fit".
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 400 });
});

afterEach(() => {
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollWidth;
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
});

describe('CustomTestimonials', () => {
  it('returns null when there are no items', () => {
    const { container } = render(<CustomTestimonials data={{ items: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the heading and one card per item', () => {
    const { container, getByText } = render(<CustomTestimonials data={{ items }} />);
    expect(getByText('Customer reviews')).toBeTruthy();
    expect(container.querySelectorAll('.testimonial-card')).toHaveLength(3);
    expect(container.querySelector('.scroll-carousel__track')).toBeTruthy();
  });

  it('renders the rating as a row of stars, read out as a number', () => {
    const { container } = render(<CustomTestimonials data={{ items }} />);
    const cards = container.querySelectorAll('.testimonial-card');
    const stars = cards[1].querySelector('.testimonial-card__stars') as HTMLElement;
    expect(stars.getAttribute('role')).toBe('img');
    expect(stars.getAttribute('aria-label')).toBe('Rated 4 out of 5');
    expect(stars.querySelectorAll('svg')).toHaveLength(5);
    expect(stars.querySelectorAll('svg.is-on')).toHaveLength(4);
  });

  it('reads the rating with Arabic-Indic digits in Arabic and keeps the avatar alt empty', () => {
    mockLocale.value = 'ar';
    try {
      const { container } = render(<CustomTestimonials data={{ items }} />);
      const stars = container.querySelectorAll('.testimonial-card')[1].querySelector(
        '.testimonial-card__stars'
      ) as HTMLElement;
      // The mock t() falls back to the English default; what matters is the digits.
      expect(stars.getAttribute('aria-label')).toBe('Rated ٤ out of ٥');
      expect(container.querySelector('.testimonial-card__avatar')?.getAttribute('alt')).toBe('');
    } finally {
      mockLocale.value = 'en';
    }
  });

  it('leaves the stars out of a review with no rating', () => {
    const { container } = render(<CustomTestimonials data={{ items: [{ name: 'A', text: 'B' }] }} />);
    expect(container.querySelector('.testimonial-card__stars')).toBeNull();
  });

  it('shows the initial when a review has no avatar', () => {
    const { container } = render(
      <CustomTestimonials data={{ items: [{ name: 'ندى', text: 'رائع', stars: 5 }] }} />
    );
    const initial = container.querySelector('.testimonial-card__avatar.is-initial');
    expect(initial?.textContent).toBe('ن');
    expect(initial?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders name, text and avatar for each card', () => {
    const { container, getByText } = render(<CustomTestimonials data={{ items }} />);
    expect(getByText('ندى الحسيني')).toBeTruthy();
    expect(getByText('رائحة رائعة')).toBeTruthy();
    expect(container.querySelector('.testimonial-card__avatar')?.getAttribute('src')).toBe(
      'a1.jpg'
    );
  });

  it('renders prev / next controls on the title line', () => {
    const { container, getByLabelText, getByText } = render(<CustomTestimonials data={{ items }} />);
    expect(getByLabelText('Previous')).toBeTruthy();
    expect(getByLabelText('Next')).toBeTruthy();
    expect(
      container.querySelector('.scroll-carousel__head')?.contains(getByText('Customer reviews'))
    ).toBe(true);
  });

  it('scrolls the row when a nav button is clicked', () => {
    const { getByLabelText } = render(<CustomTestimonials data={{ items }} />);
    fireEvent.click(getByLabelText('Next'));
    expect(Element.prototype.scrollBy).toHaveBeenCalled();
  });

  it('drags the row with the mouse and swallows the trailing click', () => {
    const { container } = render(<CustomTestimonials data={{ items }} />);
    const scroller = container.querySelector('.scroll-carousel__track') as HTMLElement;

    fireEvent.pointerDown(scroller, { pointerType: 'mouse', button: 0, clientX: 200 });
    // the pointer is captured (and `is-dragging` added) only once the drag moves,
    // so a plain click still reaches the element under it
    expect(scroller.classList.contains('is-dragging')).toBe(false);

    fireEvent.pointerMove(scroller, { clientX: 120 });
    expect(scroller.classList.contains('is-dragging')).toBe(true);

    fireEvent.pointerUp(scroller, { clientX: 120 });
    expect(scroller.classList.contains('is-dragging')).toBe(false);

    // a drag past the threshold cancels the click it would otherwise fire
    expect(fireEvent.click(scroller)).toBe(false);
  });

  it('leaves plain clicks (no drag) alone', () => {
    const { container } = render(<CustomTestimonials data={{ items }} />);
    const scroller = container.querySelector('.scroll-carousel__track') as HTMLElement;
    fireEvent.pointerDown(scroller, { pointerType: 'mouse', button: 0, clientX: 200 });
    fireEvent.pointerUp(scroller, { clientX: 200 });
    expect(fireEvent.click(scroller)).toBe(true);
  });

  it('uses the block title/description when provided', () => {
    const { getByText } = render(
      <CustomTestimonials
        data={{ items, title: 'آراء العملاء', description: 'اكتشف تجارب عملائنا' }}
      />
    );
    expect(getByText('آراء العملاء')).toBeTruthy();
    expect(getByText('اكتشف تجارب عملائنا')).toBeTruthy();
  });

  it('reads the editor shape ("items.*" keys) and drops reviews with no text', () => {
    const { container } = render(
      <CustomTestimonials
        data={{
          items: [
            { 'items.name': 'ندى', 'items.text': 'رائع', 'items.stars': 5 },
            { 'items.name': 'بدون نص' },
          ],
        }}
      />
    );
    expect(container.querySelectorAll('.testimonial-card')).toHaveLength(1);
  });

  it('shows city and product under the name, only when given', () => {
    const { container } = render(
      <CustomTestimonials
        data={{
          items: [
            { name: 'A', text: 'x', city: 'الرياض', product: 'محفظة' },
            { name: 'B', text: 'y' },
          ],
        }}
      />
    );
    const meta = container.querySelectorAll('.testimonial-card__meta');
    expect(meta).toHaveLength(1);
    expect(meta[0].textContent).toBe('الرياض · محفظة');
  });

  it('works with a single review (no arrows needed, centred track)', () => {
    const { container } = render(<CustomTestimonials data={{ items: [items[0]] }} />);
    expect(container.querySelectorAll('.testimonial-card')).toHaveLength(1);
    expect(container.querySelector('.testimonials-track--1')).toBeTruthy();
  });

  it('links to the real /testimonials page, unless the merchant hides it', () => {
    const shown = render(<CustomTestimonials data={{ items }} />);
    expect(shown.container.querySelector('a.s-testimonials__more-link')?.getAttribute('href')).toBe(
      '/testimonials'
    );
    shown.unmount();
    const hidden = render(<CustomTestimonials data={{ items, show_all_link: false }} />);
    expect(hidden.container.querySelector('.s-testimonials__more')).toBeNull();
  });
});
