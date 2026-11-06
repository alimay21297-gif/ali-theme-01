import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { HowItWorks } from '../../../app/components/home/HowItWorks';
import { formatDigits } from '../../../app/lib/formatDigits';

let locale = 'ar';

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Image: (props: Record<string, unknown>) => (
    <img alt={String(props.alt ?? '')} src={String(props.src ?? '')} className={String(props.className ?? '')} />
  ),
}));

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k, locale }),
}));

vi.mock('../../../app/hooks/useCalligraphy', () => ({
  useCalligraphy: () => ({ className: 'has-calligraphy', style: undefined }),
}));

const step = (n: number) => ({ icon: 'sicon-power', title: `Step ${n}`, text: `Text ${n}` });
const steps = (n: number) => Array.from({ length: n }, (_, i) => step(i + 1));

let observe: ((entries: { isIntersecting: boolean }[]) => void) | undefined;

function stubBrowser(reducedMotion: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reducedMotion && query.includes('prefers-reduced-motion'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        observe = cb;
      }
      observe() {}
      disconnect() {}
    }
  );
  Object.defineProperty(window, 'IntersectionObserver', { value: globalThis.IntersectionObserver, configurable: true });
}

beforeEach(() => {
  locale = 'ar';
  observe = undefined;
  stubBrowser(false);
});

afterEach(() => vi.unstubAllGlobals());

describe('HowItWorks', () => {
  it.each([2, 3, 4])('renders %i steps', (n) => {
    const { container } = render(<HowItWorks data={{ steps: steps(n) }} />);
    expect(container.querySelectorAll('.home-how__step')).toHaveLength(n);
  });

  it('renders nothing with fewer than 2 valid steps', () => {
    expect(render(<HowItWorks data={{}} />).container.firstChild).toBeNull();
    expect(render(<HowItWorks data={{ steps: steps(1) }} />).container.firstChild).toBeNull();
    expect(render(<HowItWorks data={{ steps: 'x' }} />).container.firstChild).toBeNull();
    // Untitled steps do not count.
    expect(
      render(<HowItWorks data={{ steps: [step(1), { icon: 'sicon-power', title: ' ' }] }} />).container.firstChild
    ).toBeNull();
  });

  it('caps at 4 steps, reads prefixed ids and drops icons that are not sicon classes', () => {
    const many = render(<HowItWorks data={{ steps: steps(7) }} />).container;
    expect(many.querySelectorAll('.home-how__step')).toHaveLength(4);
    const { container } = render(
      <HowItWorks
        data={{
          steps: [
            { 'steps.icon': 'sicon-star', 'steps.title': 'A', 'steps.text': 'a' },
            { icon: 'x" onclick="y', title: 'B' },
          ],
        }}
      />
    );
    const items = container.querySelectorAll('.home-how__step');
    expect(items[0].querySelector('i.sicon-star')).not.toBeNull();
    expect(items[1].querySelector('i')).toBeNull();
    expect(items[1].querySelector('p')).toBeNull();
  });

  it('numbers the steps in Arabic-Indic digits in Arabic and Latin in English', () => {
    expect(formatDigits(3, 'ar')).toBe('٣');
    expect(formatDigits(3, 'en')).toBe('3');
    const ar = render(<HowItWorks data={{ steps: steps(3) }} />).container;
    expect([...ar.querySelectorAll('.home-how__num')].map((e) => e.textContent)).toEqual(['١', '٢', '٣']);
    locale = 'en';
    const en = render(<HowItWorks data={{ steps: steps(3) }} />).container;
    expect([...en.querySelectorAll('.home-how__num')].map((e) => e.textContent)).toEqual(['1', '2', '3']);
  });

  it('shows the optional image only when set, with plain text header', () => {
    const none = render(<HowItWorks data={{ steps: steps(2) }} />).container;
    expect(none.querySelector('img')).toBeNull();
    expect(none.querySelector('.home-how__header')).toBeNull();
    const withImage = render(
      <HowItWorks data={{ steps: steps(2), image: '/phone.png', title: '<b>T</b>', subtitle: 'S' }} />
    ).container;
    expect(withImage.querySelector('img')?.getAttribute('src')).toBe('/phone.png');
    expect(withImage.querySelector('.home-how__body--with-image')).not.toBeNull();
    expect(withImage.querySelector('.home-how__title')?.textContent).toBe('<b>T</b>');
    expect(withImage.querySelector('b')).toBeNull();
  });

  it('arms the reveal and shows the steps once the list is seen', () => {
    const { container } = render(<HowItWorks data={{ steps: steps(3) }} />);
    const list = container.querySelector('.home-how__steps') as HTMLElement;
    expect(list.className).toContain('is-armed');
    expect(list.className).not.toContain('is-visible');
    act(() => observe?.([{ isIntersecting: true }]));
    expect(list.className).toContain('is-visible');
  });

  it('with reduced motion never arms the reveal', () => {
    stubBrowser(true);
    const { container } = render(<HowItWorks data={{ steps: steps(3) }} />);
    const list = container.querySelector('.home-how__steps') as HTMLElement;
    expect(list.className).not.toContain('is-armed');
    expect(observe).toBeUndefined();
  });
});
