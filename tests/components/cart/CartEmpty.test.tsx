import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartEmpty } from '../../../app/components/cart/CartEmpty';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe('CartEmpty', () => {
  it('shows a heading, one line and a link to the shop (/products, not home)', () => {
    render(<CartEmpty />);
    expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeTruthy();
    expect(screen.getByText('Start shopping and add your favourite products.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Browse products' }).getAttribute('href')).toBe(
      '/products'
    );
  });

  it('keeps the engine placeholder class and hides the icon from assistive tech', () => {
    const { container } = render(<CartEmpty />);
    expect(container.querySelector('.no-content-placeholder')).toBeTruthy();
    expect(container.querySelector('.s-empty-state__icon')?.getAttribute('aria-hidden')).toBe(
      'true'
    );
  });
});
